
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { traders } from '../src/drizzle/schema';

dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const db = drizzle(connection);

  const allTraders = await db.select().from(traders).execute();
  console.log('Traders in DB:', allTraders.map(t => t.nombre));

  await connection.end();
}

main().catch(console.error);
