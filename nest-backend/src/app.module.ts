import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { TradersModule } from './traders/traders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReportsModule } from './reports/reports.module';
import { BenchmarkModule } from './benchmark/benchmark.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DrizzleModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    TradersModule,
    TransactionsModule,
    ReportsModule,
    BenchmarkModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
