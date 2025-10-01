import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pawprint';

export const pool = new Pool({ connectionString: databaseUrl });

export async function initSchema(): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
}
