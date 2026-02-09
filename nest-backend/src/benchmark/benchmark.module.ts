import { Module } from '@nestjs/common';
import { BenchmarkService } from './benchmark.service';
import { BenchmarkController } from './benchmark.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { TradersModule } from '../traders/traders.module';

@Module({
  imports: [DrizzleModule, TradersModule],
  controllers: [BenchmarkController],
  providers: [BenchmarkService],
  exports: [BenchmarkService],
})
export class BenchmarkModule {}
