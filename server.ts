import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDB, createSqliteSessionStore } from './src/db/database';
import { requireAdmin, requireAuth, requireOwnerOrAdmin } from './src/middleware/auth';
import {
  hashPassword,
  sanitizeText,
  validateEmail,
  validatePhone,
  validatePhotosArray,
  verifyPassword
} from './src/utils/security';

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: SESSION_SECRET environment variable is missing in production.');
}
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const db = await getDB();
  const sessionStore = createSqliteSessionStore(db);

  // Security Headers Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Vite inline scripts and external images in iframe
      crossOriginEmbedderPolicy: false
    })
  );

  // Body Parser with strict payload limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Session Configuration with Persistent SqliteStore
  app.use(
    session({
      name: 'roomfinder_sid',
      store: sessionStore,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      }
    })
  );

  // Auto-generate CSRF token in session if not present
  app.use((req, res, next) => {
    if (req.session && !req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    next();
  });

  // General Rate Limiting for API routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, forwardedHeader: false }
  });
  app.use('/api', apiLimiter);

  // Rate Limiting for Auth Endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 requests per IP per window
    message: { error: 'Too many login/registration attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, forwardedHeader: false }
  });

  // CSRF Protection Middleware for State-Changing Requests
  function verifyCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    const token = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (!token || !req.session?.csrfToken || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'CSRF validation failed. Invalid or missing CSRF token.' });
    }
    next();
  }

  // Apply CSRF protection to all mutation endpoints under /api
  app.use('/api', verifyCsrf);

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // CSRF Token Endpoint
  app.get('/api/auth/csrf', (req, res) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    res.json({ csrfToken: req.session.csrfToken });
  });

  // Current Auth Session State
  app.get('/api/auth/me', (req, res) => {
    const csrfToken = req.session.csrfToken;
    if (req.session && req.session.user) {
      return res.json({ user: req.session.user, csrfToken });
    }
    res.json({ user: null, csrfToken });
  });

  // Register
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const { name, email, phone, password, role } = req.body || {};

      const cleanName = sanitizeText(name);
      const cleanEmail = email ? String(email).trim().toLowerCase() : '';
      const cleanPhone = phone ? sanitizeText(phone) : '';

      if (!cleanName || !cleanEmail || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (!validateEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      // Check if email exists
      const existing = db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      // Strict role enforcement: Only 'user' or 'owner' permitted via registration. Never 'admin'.
      const assignedRole: 'user' | 'owner' = role === 'owner' ? 'owner' : 'user';

      const passwordHash = await hashPassword(password);
      const newUserId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      db.run(
        `INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [newUserId, cleanName, cleanEmail, cleanPhone, passwordHash, assignedRole, now, now]
      );

      const sessionUser = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: assignedRole
      };

      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.status(500).json({ error: 'Registration succeeded, but session failed.' });
        }
        req.session.csrfToken = crypto.randomBytes(24).toString('hex');
        req.session.user = sessionUser;
        res.json({ user: sessionUser, csrfToken: req.session.csrfToken, message: 'Registration successful!' });
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
  });

  // Login
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const user = db.get<{
        id: string;
        name: string;
        email: string;
        phone: string;
        password_hash: string;
        role: 'user' | 'owner' | 'admin';
      }>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role
      };

      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.status(500).json({ error: 'Failed to create session.' });
        }
        req.session.csrfToken = crypto.randomBytes(24).toString('hex');
        req.session.user = sessionUser;
        res.json({ user: sessionUser, csrfToken: req.session.csrfToken, message: 'Login successful!' });
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'An unexpected error occurred during login.' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to log out.' });
      }
      res.clearCookie('roomfinder_sid');
      res.json({ message: 'Logged out successfully.' });
    });
  });

  // Track Page Views / Reach
  app.post('/api/analytics/view', (req, res) => {
    try {
      const { roomId } = req.body || {};
      const today = new Date().toISOString().split('T')[0];

      db.transaction(() => {
        db.run('UPDATE analytics_summary SET total_page_views = total_page_views + 1 WHERE id = 1;');
        db.run(
          `INSERT INTO daily_analytics (date, views, inquiries) VALUES (?, 1, 0)
           ON CONFLICT(date) DO UPDATE SET views = views + 1;`,
          [today]
        );

        if (roomId && typeof roomId === 'string') {
          db.run('UPDATE rooms SET views_count = views_count + 1 WHERE id = ?;', [roomId]);
        }
      });

      const summary = db.get<{ total_page_views: number }>(
        'SELECT total_page_views FROM analytics_summary WHERE id = 1;'
      );

      res.json({ success: true, totalViews: summary?.total_page_views || 0 });
    } catch (e) {
      console.error('Analytics error:', e);
      res.status(500).json({ error: 'Failed to track view.' });
    }
  });

  // Get Analytics Stats for Admin
  app.get('/api/analytics/stats', requireAdmin, (req, res) => {
    try {
      const userCounts = db.get<{ usersCount: number; ownersCount: number }>(`
        SELECT 
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as usersCount,
          SUM(CASE WHEN role = 'owner' THEN 1 ELSE 0 END) as ownersCount
        FROM users;
      `);

      const roomCounts = db.get<{ totalRooms: number; availableRooms: number; bookedRooms: number }>(`
        SELECT 
          COUNT(*) as totalRooms,
          SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as availableRooms,
          SUM(CASE WHEN status = 'Booked' THEN 1 ELSE 0 END) as bookedRooms
        FROM rooms;
      `);

      const inquiryCount = db.get<{ totalInquiries: number }>(
        'SELECT COUNT(*) as totalInquiries FROM inquiries;'
      );

      const summary = db.get<{ total_page_views: number }>(
        'SELECT total_page_views FROM analytics_summary WHERE id = 1;'
      );

      // 7-day trend
      const dailyTrend = db.all<{ date: string; views: number; inquiries: number }>(
        'SELECT date, views, inquiries FROM daily_analytics ORDER BY date DESC LIMIT 7;'
      ).reverse();

      // City distribution
      const cityRows = db.all<{ city: string; count: number }>(
        'SELECT city, COUNT(*) as count FROM rooms GROUP BY city ORDER BY count DESC;'
      );

      // Room Type distribution
      const typeRows = db.all<{ room_type: string; count: number }>(
        'SELECT room_type as type, COUNT(*) as count FROM rooms GROUP BY room_type ORDER BY count DESC;'
      );

      res.json({
        totalUsers: userCounts?.usersCount || 0,
        totalOwners: userCounts?.ownersCount || 0,
        totalRooms: roomCounts?.totalRooms || 0,
        availableRooms: roomCounts?.availableRooms || 0,
        bookedRooms: roomCounts?.bookedRooms || 0,
        totalPageViews: summary?.total_page_views || 0,
        totalInquiries: inquiryCount?.totalInquiries || 0,
        viewsTrend: dailyTrend,
        roomsByCity: cityRows,
        roomsByType: typeRows
      });
    } catch (e) {
      console.error('Stats error:', e);
      res.status(500).json({ error: 'Failed to fetch analytics stats.' });
    }
  });

  // Get Rooms (Public with filters)
  app.get('/api/rooms', (req, res) => {
    try {
      const { query, city, minPrice, maxPrice, roomType, status, ownerId } = req.query;

      let sql = 'SELECT * FROM rooms WHERE 1=1';
      const params: any[] = [];

      if (ownerId && typeof ownerId === 'string') {
        sql += ' AND owner_id = ?';
        params.push(ownerId);
      }

      if (status && status !== 'All') {
        sql += ' AND status = ?';
        params.push(String(status));
      }

      if (city && city !== 'All') {
        sql += ' AND LOWER(city) = LOWER(?)';
        params.push(String(city));
      }

      if (roomType && roomType !== 'All') {
        sql += ' AND room_type = ?';
        params.push(String(roomType));
      }

      if (minPrice && !isNaN(Number(minPrice))) {
        sql += ' AND price >= ?';
        params.push(Number(minPrice));
      }

      if (maxPrice && !isNaN(Number(maxPrice))) {
        sql += ' AND price <= ?';
        params.push(Number(maxPrice));
      }

      if (query && typeof query === 'string' && query.trim() !== '') {
        const q = `%${query.trim().toLowerCase()}%`;
        sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(location) LIKE ? OR LOWER(city) LIKE ? OR LOWER(amenities) LIKE ?)';
        params.push(q, q, q, q, q);
      }

      sql += ' ORDER BY created_at DESC;';

      const rows = db.all<any>(sql, params);

      const formatted = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        price: r.price,
        location: r.location,
        city: r.city,
        roomType: r.room_type,
        status: r.status,
        photos: JSON.parse(r.photos || '[]'),
        amenities: JSON.parse(r.amenities || '[]'),
        ownerId: r.owner_id,
        contactName: r.contact_name,
        contactPhone: r.contact_phone,
        contactEmail: r.contact_email,
        contactWhatsapp: r.contact_whatsapp,
        viewsCount: r.views_count,
        latitude: r.latitude != null ? Number(r.latitude) : undefined,
        longitude: r.longitude != null ? Number(r.longitude) : undefined,
        isExactLocation: r.is_exact_location === 1 || Boolean(r.is_exact_location),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

      res.json(formatted);
    } catch (e) {
      console.error('Get rooms error:', e);
      res.status(500).json({ error: 'Failed to fetch rooms.' });
    }
  });

  // Get Single Room
  app.get('/api/rooms/:id', (req, res) => {
    try {
      const r = db.get<any>('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
      if (!r) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      res.json({
        id: r.id,
        title: r.title,
        description: r.description,
        price: r.price,
        location: r.location,
        city: r.city,
        roomType: r.room_type,
        status: r.status,
        photos: JSON.parse(r.photos || '[]'),
        amenities: JSON.parse(r.amenities || '[]'),
        ownerId: r.owner_id,
        contactName: r.contact_name,
        contactPhone: r.contact_phone,
        contactEmail: r.contact_email,
        contactWhatsapp: r.contact_whatsapp,
        viewsCount: r.views_count,
        latitude: r.latitude != null ? Number(r.latitude) : undefined,
        longitude: r.longitude != null ? Number(r.longitude) : undefined,
        isExactLocation: r.is_exact_location === 1 || Boolean(r.is_exact_location),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      });
    } catch (e) {
      console.error('Get room error:', e);
      res.status(500).json({ error: 'Failed to fetch room.' });
    }
  });

  // Create Room (Protected: Owner or Admin)
  app.post('/api/rooms', requireOwnerOrAdmin, (req, res) => {
    try {
      const {
        title,
        description,
        price,
        location,
        city,
        roomType,
        photos,
        amenities,
        contactName,
        contactPhone,
        contactEmail,
        contactWhatsapp,
        status,
        latitude,
        longitude,
        isExactLocation
      } = req.body || {};

      const cleanTitle = sanitizeText(title);
      const cleanDesc = sanitizeText(description) || 'No description provided.';
      const cleanLoc = sanitizeText(location);
      const cleanCity = sanitizeText(city);
      const cleanContactName = sanitizeText(contactName) || req.session.user!.name;
      const cleanContactPhone = sanitizeText(contactPhone);
      const cleanContactEmail = contactEmail ? String(contactEmail).trim().toLowerCase() : req.session.user!.email;
      const cleanWhatsapp = contactWhatsapp ? sanitizeText(contactWhatsapp) : cleanContactPhone;

      const numericPrice = Number(price);

      if (!cleanTitle || isNaN(numericPrice) || numericPrice < 0 || !cleanLoc || !cleanCity || !cleanContactPhone) {
        return res.status(400).json({ error: 'Please provide valid title, non-negative price, location, city, and phone number.' });
      }

      // Validate coordinates if supplied
      let cleanLat: number | null = null;
      let cleanLng: number | null = null;
      let cleanIsExact = 0;

      if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null && latitude !== '' && longitude !== '') {
        const latNum = Number(latitude);
        const lngNum = Number(longitude);
        if (!isNaN(latNum) && latNum >= -90 && latNum <= 90 && !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
          cleanLat = Number(latNum.toFixed(6));
          cleanLng = Number(lngNum.toFixed(6));
          cleanIsExact = isExactLocation !== false ? 1 : 0;
        }
      }

      const validPhotos = validatePhotosArray(photos);
      const validAmenities = Array.isArray(amenities)
        ? amenities.map((a: any) => sanitizeText(String(a))).filter(Boolean)
        : ['WiFi'];

      // Owner ID is derived directly from session user
      const ownerId = req.session.user!.id;
      const newRoomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();
      const roomStatus = status === 'Booked' ? 'Booked' : 'Available';

      db.run(
        `INSERT INTO rooms (id, title, description, price, location, city, room_type, status, photos, amenities, owner_id, contact_name, contact_phone, contact_email, contact_whatsapp, views_count, latitude, longitude, is_exact_location, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?);`,
        [
          newRoomId,
          cleanTitle,
          cleanDesc,
          numericPrice,
          cleanLoc,
          cleanCity,
          roomType || 'Single Room',
          roomStatus,
          JSON.stringify(validPhotos),
          JSON.stringify(validAmenities),
          ownerId,
          cleanContactName,
          cleanContactPhone,
          cleanContactEmail,
          cleanWhatsapp,
          cleanLat,
          cleanLng,
          cleanIsExact,
          now,
          now
        ]
      );

      const createdRoom = {
        id: newRoomId,
        title: cleanTitle,
        description: cleanDesc,
        price: numericPrice,
        location: cleanLoc,
        city: cleanCity,
        roomType: roomType || 'Single Room',
        status: roomStatus,
        photos: validPhotos,
        amenities: validAmenities,
        ownerId,
        contactName: cleanContactName,
        contactPhone: cleanContactPhone,
        contactEmail: cleanContactEmail,
        contactWhatsapp: cleanWhatsapp,
        viewsCount: 0,
        latitude: cleanLat != null ? cleanLat : undefined,
        longitude: cleanLng != null ? cleanLng : undefined,
        isExactLocation: cleanIsExact === 1,
        createdAt: now,
        updatedAt: now
      };

      res.json({ room: createdRoom, message: 'Room created successfully!' });
    } catch (err) {
      console.error('Create room error:', err);
      res.status(500).json({ error: 'Failed to create room.' });
    }
  });

  // Update Room Details or Status (Protected: Owner or Admin)
  app.put('/api/rooms/:id', requireOwnerOrAdmin, (req, res) => {
    try {
      const roomId = req.params.id;
      const existing = db.get<any>('SELECT * FROM rooms WHERE id = ?', [roomId]);

      if (!existing) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      // Authorization Check: Owner can only modify their own room
      const currentUser = req.session.user!;
      if (currentUser.role === 'owner' && existing.owner_id !== currentUser.id) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own listings.' });
      }

      const {
        title,
        description,
        price,
        location,
        city,
        roomType,
        status,
        photos,
        amenities,
        contactName,
        contactPhone,
        contactEmail,
        contactWhatsapp,
        latitude,
        longitude,
        isExactLocation
      } = req.body || {};

      const cleanTitle = title !== undefined ? sanitizeText(title) : existing.title;
      const cleanDesc = description !== undefined ? sanitizeText(description) : existing.description;
      const cleanLoc = location !== undefined ? sanitizeText(location) : existing.location;
      const cleanCity = city !== undefined ? sanitizeText(city) : existing.city;
      const numericPrice = price !== undefined ? Number(price) : existing.price;
      const roomStatus = status !== undefined ? (status === 'Booked' ? 'Booked' : 'Available') : existing.status;

      // Coordinate validation on update
      let cleanLat = existing.latitude;
      let cleanLng = existing.longitude;
      let cleanIsExact = existing.is_exact_location ?? 0;

      if (latitude !== undefined && longitude !== undefined) {
        if (latitude === null || longitude === null || latitude === '' || longitude === '') {
          cleanLat = null;
          cleanLng = null;
          cleanIsExact = 0;
        } else {
          const latNum = Number(latitude);
          const lngNum = Number(longitude);
          if (!isNaN(latNum) && latNum >= -90 && latNum <= 90 && !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
            cleanLat = Number(latNum.toFixed(6));
            cleanLng = Number(lngNum.toFixed(6));
            cleanIsExact = isExactLocation !== false ? 1 : 0;
          }
        }
      }

      const validPhotos = photos !== undefined ? validatePhotosArray(photos) : JSON.parse(existing.photos);
      const validAmenities = amenities !== undefined && Array.isArray(amenities)
        ? amenities.map((a: any) => sanitizeText(String(a)))
        : JSON.parse(existing.amenities);

      const now = new Date().toISOString();

      db.run(
        `UPDATE rooms SET 
          title = ?, description = ?, price = ?, location = ?, city = ?, room_type = ?, status = ?,
          photos = ?, amenities = ?, contact_name = ?, contact_phone = ?, contact_email = ?, contact_whatsapp = ?,
          latitude = ?, longitude = ?, is_exact_location = ?, updated_at = ?
         WHERE id = ?;`,
        [
          cleanTitle,
          cleanDesc,
          numericPrice,
          cleanLoc,
          cleanCity,
          roomType || existing.room_type,
          roomStatus,
          JSON.stringify(validPhotos),
          JSON.stringify(validAmenities),
          contactName ? sanitizeText(contactName) : existing.contact_name,
          contactPhone ? sanitizeText(contactPhone) : existing.contact_phone,
          contactEmail ? String(contactEmail).trim().toLowerCase() : existing.contact_email,
          contactWhatsapp ? sanitizeText(contactWhatsapp) : existing.contact_whatsapp,
          cleanLat,
          cleanLng,
          cleanIsExact,
          now,
          roomId
        ]
      );

      const updated = {
        id: roomId,
        title: cleanTitle,
        description: cleanDesc,
        price: numericPrice,
        location: cleanLoc,
        city: cleanCity,
        roomType: roomType || existing.room_type,
        status: roomStatus,
        photos: validPhotos,
        amenities: validAmenities,
        ownerId: existing.owner_id,
        contactName: contactName ? sanitizeText(contactName) : existing.contact_name,
        contactPhone: contactPhone ? sanitizeText(contactPhone) : existing.contact_phone,
        contactEmail: contactEmail ? String(contactEmail).trim().toLowerCase() : existing.contact_email,
        contactWhatsapp: contactWhatsapp ? sanitizeText(contactWhatsapp) : existing.contact_whatsapp,
        viewsCount: existing.views_count,
        latitude: cleanLat != null ? cleanLat : undefined,
        longitude: cleanLng != null ? cleanLng : undefined,
        isExactLocation: cleanIsExact === 1,
        createdAt: existing.created_at,
        updatedAt: now
      };

      res.json({ room: updated, message: 'Room updated successfully!' });
    } catch (err) {
      console.error('Update room error:', err);
      res.status(500).json({ error: 'Failed to update room.' });
    }
  });

  // Delete Room (Protected: Owner or Admin)
  app.delete('/api/rooms/:id', requireOwnerOrAdmin, (req, res) => {
    try {
      const roomId = req.params.id;
      const existing = db.get<any>('SELECT * FROM rooms WHERE id = ?', [roomId]);

      if (!existing) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      // Authorization Check
      const currentUser = req.session.user!;
      if (currentUser.role === 'owner' && existing.owner_id !== currentUser.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own listings.' });
      }

      db.transaction(() => {
        db.run('DELETE FROM inquiries WHERE room_id = ?;', [roomId]);
        db.run('DELETE FROM rooms WHERE id = ?;', [roomId]);
      });

      res.json({ message: 'Room deleted successfully!' });
    } catch (err) {
      console.error('Delete room error:', err);
      res.status(500).json({ error: 'Failed to delete room.' });
    }
  });

  // Admin - Get Users & Owners
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    try {
      const users = db.all<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        created_at: string;
      }>('SELECT id, name, email, phone, role, created_at as createdAt FROM users ORDER BY created_at DESC;');

      res.json(users);
    } catch (e) {
      console.error('Get users error:', e);
      res.status(500).json({ error: 'Failed to fetch users.' });
    }
  });

  // Admin - Delete User or Owner
  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    try {
      const userId = req.params.id;
      const user = db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Cannot delete primary admin account.' });
      }

      db.transaction(() => {
        // If owner is deleted, delete their rooms & inquiries
        if (user.role === 'owner') {
          db.run('DELETE FROM inquiries WHERE owner_id = ?;', [userId]);
          db.run('DELETE FROM rooms WHERE owner_id = ?;', [userId]);
        }
        db.run('DELETE FROM inquiries WHERE user_id = ?;', [userId]);
        db.run('DELETE FROM users WHERE id = ?;', [userId]);
      });

      res.json({ message: `Successfully deleted ${user.role} ${user.name}` });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  });

  // Submit Inquiry
  app.post('/api/inquiries', (req, res) => {
    try {
      const { roomId, message, userName, userPhone, userEmail } = req.body || {};

      if (!roomId || !message) {
        return res.status(400).json({ error: 'Please select a room and provide a message.' });
      }

      const room = db.get<any>('SELECT * FROM rooms WHERE id = ?', [roomId]);
      if (!room) {
        return res.status(404).json({ error: 'Target room does not exist.' });
      }

      // If user is authenticated, use session info; otherwise use validated payload info
      const currentUser = req.session?.user;
      const finalUserId = currentUser ? currentUser.id : null;
      const finalUserName = currentUser ? currentUser.name : sanitizeText(userName) || 'Guest Renter';
      const finalUserPhone = currentUser ? currentUser.phone : sanitizeText(userPhone) || '';
      const finalUserEmail = currentUser ? currentUser.email : (userEmail ? String(userEmail).trim().toLowerCase() : '');

      const cleanMessage = sanitizeText(message);
      if (!cleanMessage) {
        return res.status(400).json({ error: 'Inquiry message cannot be empty.' });
      }

      const newInquiryId = `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      db.transaction(() => {
        db.run(
          `INSERT INTO inquiries (id, room_id, room_title, user_id, user_name, user_email, user_phone, owner_id, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?);`,
          [
            newInquiryId,
            room.id,
            room.title,
            finalUserId,
            finalUserName,
            finalUserEmail,
            finalUserPhone,
            room.owner_id,
            cleanMessage,
            now
          ]
        );

        db.run(
          `INSERT INTO daily_analytics (date, views, inquiries) VALUES (?, 0, 1)
           ON CONFLICT(date) DO UPDATE SET inquiries = inquiries + 1;`,
          [today]
        );
      });

      const newInquiry = {
        id: newInquiryId,
        roomId: room.id,
        roomTitle: room.title,
        userId: finalUserId || 'guest',
        userName: finalUserName,
        userEmail: finalUserEmail,
        userPhone: finalUserPhone,
        ownerId: room.owner_id,
        message: cleanMessage,
        status: 'Pending' as const,
        createdAt: now
      };

      res.json({ inquiry: newInquiry, message: 'Inquiry sent to owner successfully!' });
    } catch (err) {
      console.error('Submit inquiry error:', err);
      res.status(500).json({ error: 'Failed to submit inquiry.' });
    }
  });

  // Get Inquiries for Owner (Protected: Owner or Admin)
  app.get('/api/inquiries/owner/:ownerId', requireOwnerOrAdmin, (req, res) => {
    try {
      const targetOwnerId = req.params.ownerId;
      const currentUser = req.session.user!;

      // Authorization Check: Owner can only view their own inquiries
      if (currentUser.role === 'owner' && targetOwnerId !== currentUser.id) {
        return res.status(403).json({ error: 'Forbidden: You can only view inquiries sent to your listings.' });
      }

      const rows = db.all<any>(
        'SELECT * FROM inquiries WHERE owner_id = ? ORDER BY created_at DESC;',
        [targetOwnerId]
      );

      const formatted = rows.map((i) => ({
        id: i.id,
        roomId: i.room_id,
        roomTitle: i.room_title,
        userId: i.user_id || 'guest',
        userName: i.user_name,
        userEmail: i.user_email,
        userPhone: i.user_phone,
        ownerId: i.owner_id,
        message: i.message,
        status: i.status,
        createdAt: i.created_at
      }));

      res.json(formatted);
    } catch (e) {
      console.error('Get owner inquiries error:', e);
      res.status(500).json({ error: 'Failed to fetch inquiries.' });
    }
  });

  // Get Inquiries by User (Protected: Authenticated User or Admin)
  app.get('/api/inquiries/user/:userId', requireAuth, (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUser = req.session.user!;

      // Authorization Check
      if (currentUser.role !== 'admin' && targetUserId !== currentUser.id) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own submitted inquiries.' });
      }

      const rows = db.all<any>(
        'SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC;',
        [targetUserId]
      );

      const formatted = rows.map((i) => ({
        id: i.id,
        roomId: i.room_id,
        roomTitle: i.room_title,
        userId: i.user_id,
        userName: i.user_name,
        userEmail: i.user_email,
        userPhone: i.user_phone,
        ownerId: i.owner_id,
        message: i.message,
        status: i.status,
        createdAt: i.created_at
      }));

      res.json(formatted);
    } catch (e) {
      console.error('Get user inquiries error:', e);
      res.status(500).json({ error: 'Failed to fetch inquiries.' });
    }
  });

  // Serve Frontend with Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Secured RoomFinder Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
