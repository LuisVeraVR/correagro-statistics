import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { TradersModule } from '../traders/traders.module';

@Module({
  imports: [DrizzleModule, TradersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
