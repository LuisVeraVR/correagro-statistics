import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connection = await mysql.createConnection({
          host: configService.get<string>('DB_HOST') || '127.0.0.1',
          port: Number(configService.get<string>('DB_PORT')) || 3306,
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS') || '',
          database: configService.get<string>('DB_NAME'),
        });
        return drizzle(connection, { schema, mode: 'default' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
