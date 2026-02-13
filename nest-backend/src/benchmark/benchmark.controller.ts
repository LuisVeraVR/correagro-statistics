import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { BenchmarkService } from './benchmark.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('benchmark')
@UseGuards(JwtAuthGuard)
export class BenchmarkController {
  constructor(private readonly benchmarkService: BenchmarkService) {}

  @Get('summary')
  async getSummary(@Query('year') year: string) {
    return this.benchmarkService.getSummary(Number(year));
  }

  @Get('ranking')
  async getRanking(@Query('year') year: string, @Query('month') month: string, @Query('limit') limit: string) {
    return this.benchmarkService.getRanking(Number(year), month, limit ? Number(limit) : 50);
  }

  @Get('trends')
  async getTrends(@Query('year') year: string) {
    return this.benchmarkService.getTrends(Number(year));
  }

  @Get('compare')
  async getComparison(@Query('ids') ids: string, @Query('period') period: string, @Request() req) {
    let traders = ids ? ids.split(',').map(s => s.trim()) : [];

    // RBAC: Traders can only compare themselves (or see their own data in this view)
    if (req.user.role === 'trader' && req.user.traderName) {
        traders = [req.user.traderName];
    }

    const periodMonths = period ? Number(period) : 12;
    return this.benchmarkService.getComparison(traders, periodMonths);
  }

  @Get('correagro')
  async getCorreagroStats(@Query('year') year: string, @Request() req) {
    const traderName = req.user.role === 'trader' ? req.user.traderName : 'Correagro S.A.';
    return this.benchmarkService.getCorreagroStats(Number(year), traderName);
  }

  @Get('sectors')
  async getSectors(@Query('year') year: string) {
    return this.benchmarkService.getSectors(Number(year));
  }

  @Get('products')
  async getProducts(@Query('year') year: string) {
    return this.benchmarkService.getProducts(Number(year));
  }
}
