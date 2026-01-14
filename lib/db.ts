import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { FileMetadata } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'files.db');
const JSON_PATH = path.join(DATA_DIR, 'files.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance: Database.Database | null = null;

function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');

  // Initialize database schema
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      type TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      remark TEXT,
      path TEXT NOT NULL
    )
  `);

  // Migration: Import from JSON if DB is empty and JSON exists
  const countResult = dbInstance.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number };

  if (countResult.count === 0 && fs.existsSync(JSON_PATH)) {
    try {
      const data = fs.readFileSync(JSON_PATH, 'utf-8');
      const files: FileMetadata[] = JSON.parse(data);

      if (files.length > 0) {
        console.log(`Migrating ${files.length} files from JSON to SQLite...`);
        const insert = dbInstance.prepare(`
          INSERT INTO files (id, name, size, type, uploadDate, remark, path)
          VALUES (@id, @name, @size, @type, @uploadDate, @remark, @path)
        `);

        const insertMany = dbInstance.transaction((files: FileMetadata[]) => {
          for (const file of files) {
            insert.run(file);
          }
        });

        insertMany(files);
        console.log('Migration complete.');
      }
    } catch (error) {
      console.error('Failed to migrate data from JSON:', error);
    }
  }

  return dbInstance;
}

// In Next.js dev mode, the module might be re-evaluated, so we need to be careful.
// We can use a global variable to store the connection if needed, but for now this is fine for this environment.
const db = getDb();

export default db;
