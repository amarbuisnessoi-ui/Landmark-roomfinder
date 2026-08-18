import { createClient, type Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { AsyncLocalStorage } from 'node:async_hooks';
import { INITIAL_ROOMS } from '../data/initialRooms';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@landmark.com';
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Landmark$Roomfinder';

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.warn('Turso environment variables are missing. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
}

let clientInstance: Client | null = null;
let initPromise: Promise<void> | null = null;

type DbExecutor = {
  execute: (stmt: { sql: string; args?: any[] }) => Promise<any>;
};

function getClient(): Client {
  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured.');
  }

  if (!clientInstance) {
    clientInstance = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN
    });
  }

  return clientInstance;
}

async function initializeDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = getClient();

    const schema = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'owner', 'admin')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS rooms (
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
      );`,
      `CREATE TABLE IF NOT EXISTS inquiries (
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
      );`,
      `CREATE TABLE IF NOT EXISTS analytics_summary (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        total_page_views INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS daily_analytics (
        date TEXT PRIMARY KEY,
        views INTEGER DEFAULT 0,
        inquiries INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_rooms_city ON rooms(city);`,
      `CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);`,
      `CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);`,
      `CREATE INDEX IF NOT EXISTS idx_inquiries_owner ON inquiries(owner_id);`,
      `CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);`
    ];

    for (const sql of schema) {
      await client.execute({ sql });
    }

    const countResult = await client.execute({
      sql: 'SELECT COUNT(*) AS count FROM users'
    });
    const userCount = Number(countResult.rows[0]?.count ?? 0);

    if (userCount === 0) {
      await seedDatabase(client);
    } else {
      // Keep the configured admin password synchronized with the seeded admin account.
      const adminResult = await client.execute({
        sql: 'SELECT id, password_hash FROM users WHERE role = ? LIMIT 1',
        args: ['admin']
      });

      const admin = adminResult.rows[0] as any;
      if (admin?.id && admin?.password_hash) {
        const valid = await bcrypt.compare(ADMIN_PASSWORD, String(admin.password_hash));
        if (!valid) {
          const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
          await client.execute({
            sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
            args: [hash, new Date().toISOString(), admin.id]
          });
        }
      }

      // Fill missing coordinates for bundled rooms without overwriting user edits.
      for (const room of INITIAL_ROOMS) {
        if (room.latitude !== undefined && room.longitude !== undefined) {
          await client.execute({
            sql: `UPDATE rooms
                  SET latitude = ?, longitude = ?, is_exact_location = 1
                  WHERE id = ? AND latitude IS NULL`,
            args: [room.latitude, room.longitude, room.id]
          });
        }
      }
    }
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

async function seedDatabase(client: Client) {
  console.log('Seeding Turso database...');
  const now = new Date().toISOString();

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const ownerPasswordHash = await bcrypt.hash('ownerpassword123', 10);
  const userPasswordHash = await bcrypt.hash('userpassword123', 10);

  const seedUsers = [
    ['user-admin', 'Landmark Admin', ADMIN_EMAIL, '+1 (555) 000-1111', adminPasswordHash, 'admin'],
    ['owner-1', 'Marcus Vance', 'marcus.vance@landmark.com', '+1 (555) 234-8901', ownerPasswordHash, 'owner'],
    ['owner-2', 'Elena Rostova', 'elena.rostova@landmark.com', '+1 (555) 876-1234', ownerPasswordHash, 'owner'],
    ['owner-3', 'David Sterling', 'david.sterling@landmark.com', '+1 (555) 432-9087', ownerPasswordHash, 'owner'],
    ['user-1', 'Sarah Connor', 'sarah.c@gmail.com', '+1 (555) 999-8822', userPasswordHash, 'user'],
    ['user-2', 'Alexander Wright', 'alex.wright@outlook.com', '+1 (555) 777-3344', userPasswordHash, 'user']
  ];

  for (const [id, name, email, phone, passHash, role] of seedUsers) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO users
            (id, name, email, phone, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, email, phone, passHash, role, now, now]
    });
  }

  for (const r of INITIAL_ROOMS) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO rooms
        (id, title, description, price, location, city, room_type, status, photos,
         amenities, owner_id, contact_name, contact_phone, contact_email, contact_whatsapp,
         views_count, latitude, longitude, is_exact_location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.id, r.title, r.description, r.price, r.location, r.city, r.roomType, r.status,
        JSON.stringify(r.photos), JSON.stringify(r.amenities), r.ownerId, r.contactName,
        r.contactPhone, r.contactEmail, r.contactWhatsapp || '', r.viewsCount || 0,
        r.latitude ?? null, r.longitude ?? null, r.isExactLocation ? 1 : 0,
        r.createdAt || now, r.updatedAt || now
      ]
    });
  }

  const roomOne = await client.execute({
    sql: 'SELECT id, title, owner_id FROM rooms WHERE id = ?',
    args: ['room-1']
  });

  if (roomOne.rows.length > 0) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO inquiries
        (id, room_id, room_title, user_id, user_name, user_email, user_phone,
         owner_id, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'inq-1', 'room-1', String(roomOne.rows[0].title),
        'user-1', 'Sarah Connor', 'sarah.c@gmail.com', '+1 (555) 999-8822',
        String(roomOne.rows[0].owner_id),
        'Hi Marcus! Is this studio available for immediate move-in starting next month?',
        'Pending', now
      ]
    });
  }

  await client.execute({
    sql: 'INSERT OR IGNORE INTO analytics_summary (id, total_page_views) VALUES (1, 1482)'
  });

  const dailySample = [
    ['2026-08-01', 180, 3],
    ['2026-08-02', 210, 5],
    ['2026-08-03', 195, 4],
    ['2026-08-04', 240, 8],
    ['2026-08-05', 310, 12],
    ['2026-08-06', 290, 9],
    ['2026-08-07', 57, 2]
  ];

  for (const [date, views, inquiries] of dailySample) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO daily_analytics (date, views, inquiries)
            VALUES (?, ?, ?)`,
      args: [date, views, inquiries]
    });
  }
}

export async function getDB(): Promise<{
  run: (sql: string, params?: any[]) => Promise<void>;
  get: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
  all: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  transaction: <T>(fn: () => Promise<T>) => Promise<T>;
}> {
  await initializeDatabase();
  const client = getClient();
  const txStorage = new AsyncLocalStorage<any>();

  const executor = () => txStorage.getStore() || client;

  const db = {
    run: async (sql: string, params: any[] = []) => {
      await executor().execute({ sql, args: params });
    },

    get: async <T = any>(sql: string, params: any[] = []) => {
      const result = await executor().execute({ sql, args: params });
      return result.rows[0] as unknown as T | undefined;
    },

    all: async <T = any>(sql: string, params: any[] = []) => {
      const result = await executor().execute({ sql, args: params });
      return result.rows as unknown as T[];
    },

    transaction: async <T>(fn: () => Promise<T>) => {
      const tx = await client.transaction('write');
      try {
        const result = await txStorage.run(tx, fn);
        await tx.commit();
        return result;
      } catch (error) {
        try {
          await tx.rollback();
        } catch {}
        throw error;
      } finally {
        tx.close();
      }
    }
  };

  return db;
}

export function createSqliteSessionStore(dbWrapper: {
  run: (sql: string, params?: any[]) => Promise<void>;
  get: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
  all: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
}) {
  class TursoSessionStore extends session.Store {
    get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
      void (async () => {
        try {
          const row = await dbWrapper.get<{ sess: string; expire: string }>(
            'SELECT sess, expire FROM sessions WHERE sid = ?',
            [sid]
          );

          if (!row) return callback(null, null);

          if (new Date(row.expire).getTime() < Date.now()) {
            this.destroy(sid);
            return callback(null, null);
          }

          callback(null, JSON.parse(row.sess));
        } catch (err) {
          callback(err);
        }
      })();
    }

    set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
      void (async () => {
        try {
          const maxAge = sessionData.cookie?.maxAge || 86400000;
          const expire = new Date(Date.now() + maxAge).toISOString();
          const sess = JSON.stringify(sessionData);

          await dbWrapper.run(
            `INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)
             ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire`,
            [sid, sess, expire]
          );

          callback?.();
        } catch (err) {
          callback?.(err);
        }
      })();
    }

    destroy(sid: string, callback?: (err?: any) => void) {
      void (async () => {
        try {
          await dbWrapper.run('DELETE FROM sessions WHERE sid = ?', [sid]);
          callback?.();
        } catch (err) {
          callback?.(err);
        }
      })();
    }

    touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
      this.set(sid, sessionData, callback);
    }
  }

  return new TursoSessionStore();
}
