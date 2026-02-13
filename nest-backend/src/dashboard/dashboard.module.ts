import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TradersModule } from '../traders/traders.module';

@Module({
  imports: [TradersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
