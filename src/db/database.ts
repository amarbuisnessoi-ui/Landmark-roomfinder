import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { INITIAL_ROOMS } from '../data/initialRooms';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'roomfinder.sqlite');
const LEGACY_DB_FILE = path.join(DB_DIR, 'db.json');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@landmark.com';
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Landmark$Roomfinder';

let dbInstance: SqlJsDatabase | null = null;

function saveDatabaseToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, buffer);
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error saving SQLite DB to disk:', err);
  }
}

export async function getDB(): Promise<{
  run: (sql: string, params?: any[]) => void;
  get: <T = any>(sql: string, params?: any[]) => T | undefined;
  all: <T = any>(sql: string, params?: any[]) => T[];
  transaction: <T>(fn: () => T) => T;
}> {
  if (!dbInstance) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();
    let isFresh = true;

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE);
        if (fileBuffer && fileBuffer.length > 0) {
          dbInstance = new SQL.Database(fileBuffer);
          isFresh = false;
        }
      } catch (loadErr) {
        console.warn('Existing SQLite file corrupted or malformed. Rebuilding fresh database...', loadErr);
        try {
          fs.unlinkSync(DB_FILE);
        } catch {
          // ignore unlink error
        }
        dbInstance = null;
      }
    }

    if (!dbInstance) {
      dbInstance = new SQL.Database();
      isFresh = true;
    }

    // Enable foreign keys
    dbInstance.run('PRAGMA foreign_keys = ON;');

    // Initialize Schema
    initSchema(dbInstance);

    // Seed Data if DB was empty or fresh
    if (isFresh) {
      await seedDataIfEmpty(dbInstance);
    }

    saveDatabaseToDisk();
  }

  const wrapper = {
    run: (sql: string, params: any[] = []) => {
      if (!dbInstance) throw new Error('DB not initialized');
      const stmt = dbInstance.prepare(sql);
      stmt.run(params);
      stmt.free();
      saveDatabaseToDisk();
    },
    get: <T = any>(sql: string, params: any[] = []): T | undefined => {
      if (!dbInstance) throw new Error('DB not initialized');
      const stmt = dbInstance.prepare(sql);
      const row = stmt.getAsObject(params) as unknown as T;
      stmt.free();
      if (row && Object.values(row as any).some((v) => v !== undefined && v !== null)) {
        return row;
      }
      return undefined;
    },
    all: <T = any>(sql: string, params: any[] = []): T[] => {
      if (!dbInstance) throw new Error('DB not initialized');
      const stmt = dbInstance.prepare(sql);
      stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return results;
    },
    transaction: <T>(fn: () => T): T => {
      if (!dbInstance) throw new Error('DB not initialized');
      dbInstance.run('BEGIN TRANSACTION;');
      try {
        const result = fn();
        dbInstance.run('COMMIT;');
        saveDatabaseToDisk();
        return result;
      } catch (err) {
        dbInstance.run('ROLLBACK;');
        throw err;
      }
    }
  };

  return wrapper;
}

export function createSqliteSessionStore(dbWrapper: {
  run: (sql: string, params?: any[]) => void;
  get: <T = any>(sql: string, params?: any[]) => T | undefined;
  all: <T = any>(sql: string, params?: any[]) => T[];
}) {
  class SqliteStore extends session.Store {
    get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
      try {
        const row = dbWrapper.get<{ sess: string; expire: string }>(
          'SELECT sess, expire FROM sessions WHERE sid = ?',
          [sid]
        );
        if (!row) return callback(null, null);
        if (new Date(row.expire).getTime() < Date.now()) {
          this.destroy(sid, () => {});
          return callback(null, null);
        }
        const sess = JSON.parse(row.sess);
        callback(null, sess);
      } catch (err) {
        callback(err);
      }
    }

    set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
      try {
        const maxAge = sessionData.cookie?.maxAge || 86400000;
        const expire = new Date(Date.now() + maxAge).toISOString();
        const sess = JSON.stringify(sessionData);

        dbWrapper.run(
          `INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)
           ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire;`,
          [sid, sess, expire]
        );
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }

    destroy(sid: string, callback?: (err?: any) => void) {
      try {
        dbWrapper.run('DELETE FROM sessions WHERE sid = ?;', [sid]);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }

    touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
      this.set(sid, sessionData, callback);
    }
  }

  return new SqliteStore();
}

function initSchema(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'owner', 'admin')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL CHECK(price >= 0),
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      room_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Available', 'Booked')),
      photos TEXT NOT NULL,
      amenities TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_whatsapp TEXT,
      views_count INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      is_exact_location INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      room_title TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Contacted', 'Closed')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_summary (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total_page_views INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_analytics (
      date TEXT PRIMARY KEY,
      views INTEGER DEFAULT 0,
      inquiries INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_city ON rooms(city);
    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
    CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_owner ON inquiries(owner_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
  `);

  // Backwards compatibility column migrations for existing SQLite stores
  try {
    db.run('ALTER TABLE rooms ADD COLUMN latitude REAL;');
  } catch (_) {}
  try {
    db.run('ALTER TABLE rooms ADD COLUMN longitude REAL;');
  } catch (_) {}
  try {
    db.run('ALTER TABLE rooms ADD COLUMN is_exact_location INTEGER DEFAULT 0;');
  } catch (_) {}
}

async function seedDataIfEmpty(db: SqlJsDatabase) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  stmt.step();
  const userCount = (stmt.getAsObject() as any).count || 0;
  stmt.free();

  if (userCount > 0) {
    // Audit existing admin password hash validity
    const adminUser = db.prepare('SELECT id, email, password_hash FROM users WHERE role = ? LIMIT 1');
    adminUser.bind(['admin']);
    let row: any = null;
    if (adminUser.step()) {
      row = adminUser.getAsObject();
    }
    adminUser.free();

    const currentHash = row?.password_hash;
    if (currentHash && row?.id) {
      const isValid = await bcrypt.compare(ADMIN_PASSWORD, currentHash);
      if (!isValid) {
        const newHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const updateStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        updateStmt.bind([newHash, row.id]);
        updateStmt.step();
        updateStmt.free();
        saveDatabaseToDisk();
      }
    }

    // Sync coordinates for initial default rooms if not yet populated
    for (const initRoom of INITIAL_ROOMS) {
      if (initRoom.latitude !== undefined && initRoom.longitude !== undefined) {
        try {
          db.run(
            `UPDATE rooms SET latitude = ?, longitude = ?, is_exact_location = 1 WHERE id = ? AND latitude IS NULL;`,
            [initRoom.latitude, initRoom.longitude, initRoom.id]
          );
        } catch (_) {}
      }
    }
    saveDatabaseToDisk();
    return;
  }

  console.log('Seeding relational SQLite database...');

  // Default seed passwords
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const ownerPasswordHash = await bcrypt.hash('ownerpassword123', 10);
  const userPasswordHash = await bcrypt.hash('userpassword123', 10);

  const now = new Date().toISOString();

  // Check if legacy db.json exists to migrate existing data securely
  let legacyData: any = null;
  if (fs.existsSync(LEGACY_DB_FILE)) {
    try {
      const content = fs.readFileSync(LEGACY_DB_FILE, 'utf-8');
      legacyData = JSON.parse(content);
    } catch (e) {
      console.error('Error reading legacy db.json for migration', e);
    }
  }

  if (legacyData && Array.isArray(legacyData.users) && legacyData.users.length > 0) {
    console.log('Migrating data from legacy db.json to SQLite DB...');
    // Seed Users from Legacy
    for (const u of legacyData.users) {
      let plainPass = u.password;
      if (!plainPass || typeof plainPass !== 'string') {
        plainPass = u.role === 'admin' ? ADMIN_PASSWORD : u.role === 'owner' ? 'ownerpassword123' : 'userpassword123';
      }
      plainPass = String(plainPass).trim();
      const pHash = await bcrypt.hash(plainPass, 10);

      db.run(
        `INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [u.id, u.name, u.email.trim().toLowerCase(), u.phone || '', pHash, u.role, u.createdAt || now, now]
      );
    }

    // Seed Rooms
    if (Array.isArray(legacyData.rooms)) {
      for (const r of legacyData.rooms) {
        db.run(
          `INSERT OR IGNORE INTO rooms (id, title, description, price, location, city, room_type, status, photos, amenities, owner_id, contact_name, contact_phone, contact_email, contact_whatsapp, views_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            r.id,
            r.title,
            r.description,
            r.price,
            r.location,
            r.city,
            r.roomType,
            r.status,
            JSON.stringify(r.photos || []),
            JSON.stringify(r.amenities || []),
            r.ownerId,
            r.contactName,
            r.contactPhone,
            r.contactEmail,
            r.contactWhatsapp || '',
            r.viewsCount || 0,
            r.createdAt || now,
            r.updatedAt || now
          ]
        );
      }
    }

    // Seed Inquiries
    if (Array.isArray(legacyData.inquiries)) {
      for (const inq of legacyData.inquiries) {
        db.run(
          `INSERT OR IGNORE INTO inquiries (id, room_id, room_title, user_id, user_name, user_email, user_phone, owner_id, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            inq.id,
            inq.roomId,
            inq.roomTitle,
            inq.userId,
            inq.userName,
            inq.userEmail,
            inq.userPhone,
            inq.ownerId,
            inq.message,
            inq.status || 'Pending',
            inq.createdAt || now
          ]
        );
      }
    }

    // Analytics
    if (legacyData.analytics) {
      db.run(`INSERT OR REPLACE INTO analytics_summary (id, total_page_views) VALUES (1, ?);`, [
        legacyData.analytics.totalPageViews || 0
      ]);

      if (legacyData.analytics.dailyViews) {
        for (const [date, views] of Object.entries(legacyData.analytics.dailyViews)) {
          const inquiriesCount = legacyData.analytics.dailyInquiries?.[date] || 0;
          db.run(
            `INSERT OR REPLACE INTO daily_analytics (date, views, inquiries) VALUES (?, ?, ?);`,
            [date, views, inquiriesCount]
          );
        }
      }
    }
  } else {
    // Default Fresh Seed
    const seedUsers = [
      ['user-admin', 'Landmark Admin', ADMIN_EMAIL, '+1 (555) 000-1111', adminPasswordHash, 'admin'],
      ['owner-1', 'Marcus Vance', 'marcus.vance@landmark.com', '+1 (555) 234-8901', ownerPasswordHash, 'owner'],
      ['owner-2', 'Elena Rostova', 'elena.rostova@landmark.com', '+1 (555) 876-1234', ownerPasswordHash, 'owner'],
      ['owner-3', 'David Sterling', 'david.sterling@landmark.com', '+1 (555) 432-9087', ownerPasswordHash, 'owner'],
      ['user-1', 'Sarah Connor', 'sarah.c@gmail.com', '+1 (555) 999-8822', userPasswordHash, 'user'],
      ['user-2', 'Alexander Wright', 'alex.wright@outlook.com', '+1 (555) 777-3344', userPasswordHash, 'user']
    ];

    for (const [id, name, email, phone, passHash, role] of seedUsers) {
      const uStmt = db.prepare('INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);');
      uStmt.bind([id, name, email, phone, passHash, role, now, now]);
      uStmt.step();
      uStmt.free();
    }

    // Initial Rooms
    for (const r of INITIAL_ROOMS) {
      db.run(
        `INSERT INTO rooms (id, title, description, price, location, city, room_type, status, photos, amenities, owner_id, contact_name, contact_phone, contact_email, contact_whatsapp, views_count, latitude, longitude, is_exact_location, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          r.id,
          r.title,
          r.description,
          r.price,
          r.location,
          r.city,
          r.roomType,
          r.status,
          JSON.stringify(r.photos),
          JSON.stringify(r.amenities),
          r.ownerId,
          r.contactName,
          r.contactPhone,
          r.contactEmail,
          r.contactWhatsapp || '',
          r.viewsCount,
          r.latitude ?? null,
          r.longitude ?? null,
          r.isExactLocation ? 1 : 0,
          r.createdAt,
          r.updatedAt
        ]
      );
    }

    // Initial Inquiries
    db.run(
      `INSERT INTO inquiries (id, room_id, room_title, user_id, user_name, user_email, user_phone, owner_id, message, status, created_at)
       VALUES ('inq-1', 'room-1', 'Modern Sunset Heights Studio & Terrace', 'user-1', 'Sarah Connor', 'sarah.c@gmail.com', '+1 (555) 999-8822', 'owner-1', 'Hi Marcus! Is this studio available for immediate move-in starting next month?', 'Pending', ?);`,
      [now]
    );

    // Initial Analytics
    db.run(`INSERT INTO analytics_summary (id, total_page_views) VALUES (1, 1482);`);

    const dailySample = [
      ['2026-08-01', 180, 3],
      ['2026-08-02', 210, 5],
      ['2026-08-03', 195, 4],
      ['2026-08-04', 240, 8],
      ['2026-08-05', 310, 12],
      ['2026-08-06', 290, 9],
      ['2026-08-07', 57, 2]
    ];

    for (const [date, views, inqs] of dailySample) {
      db.run(`INSERT INTO daily_analytics (date, views, inquiries) VALUES (?, ?, ?);`, [date, views, inqs]);
    }
  }
}
