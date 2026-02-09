import { Module } from '@nestjs/common';
import { TradersController } from './traders.controller';
import { TradersService } from './traders.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [TradersController],
  providers: [TradersService],
  exports: [TradersService],
})
export class TradersModule {}
