
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { users } from '../src/drizzle/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const usersToSeed = [
  { name: 'Maria Paula Ramirez', email: 'comercial.orfbogota@correagro.com', password: 'LPKOJI*', role: 'trader' },
  { name: 'Luis Fernando Velez', email: 'luis.velez@correagro.com', password: 'LFV345*', role: 'trader' },
  { name: 'Eduardo Velez', email: 'eduardo.velez@correagro.com', password: 'hngbfv', role: 'trader' },
  { name: 'Registros Bucaramanga I', email: 'registros.bucaramanga@correagro.com', password: 'Martha23', role: 'trader' },
  // Modified email for Bucaramanga II to avoid unique constraint violation
  { name: 'Registros Bucaramanga II', email: 'registros.bucaramanga2@correagro.com', password: 'Yhoana33', role: 'trader' },
  { name: 'Javier Correa', email: 'javier.correa@correagro.com', password: 'jacobo61', role: 'trader' },
  { name: 'Maria Alejandra Prieto', email: 'director.mcp@correagro.com', password: 'Bogota2026', role: 'trader' },
  { name: 'Registros Bogota II', email: 'registros.bogota@correagro.com', password: 'RegBog2026', role: 'trader' },
  { name: 'Gloria Botero', email: 'gestionfactoring@correagro.com', password: 'CAgro*769', role: 'trader' },
];

async function main() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const db = drizzle(connection);

  console.log('Seeding users...');

  for (const user of usersToSeed) {
    try {
      const existingUser = await db.select().from(users).where(eq(users.email, user.email)).execute(); // Removed user.role from where clause as it's not needed for uniqueness check
      
      const hashedPassword = await bcrypt.hash(user.password, 10);

      if (existingUser.length > 0) {
        console.log(`Updating user ${user.name} (${user.email})`);
        await db.update(users).set({
          name: user.name,
          password: hashedPassword,
          role: user.role as any,
          traderName: user.name.toUpperCase(),
        }).where(eq(users.email, user.email)).execute();
      } else {
        console.log(`Creating user ${user.name} (${user.email})`);
        await db.insert(users).values({
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role as any,
          traderName: user.name.toUpperCase(),
        }).execute();
      }
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }

  console.log('Seeding completed.');
  await connection.end();
}

main().catch(console.error);
