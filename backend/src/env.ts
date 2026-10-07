// Must be imported before any module that reads process.env at load time.
// ES module imports are evaluated in order, so importing this first guarantees
// .env values (DB_PATH, STORAGE_PATH, SESSION_TTL_MS, limits, ...) are present
// before db.ts / storage.ts / sessionStore.ts / auth.ts capture them.
import dotenv from 'dotenv';

dotenv.config();