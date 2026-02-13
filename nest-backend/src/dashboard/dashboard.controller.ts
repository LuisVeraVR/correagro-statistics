import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getDashboardSummary(
    @Query('year') year: number, 
    @Query('withGroups') withGroupsStr: string, 
    @Query('trader') trader: string,
    @Request() req
  ) {
    const user = req.user;
    const withGroups = withGroupsStr !== 'false'; // Default to true
    
    // Allow overriding trader name from query param (useful for debugging or specific filtering)
    // If user is trader, they should only see their own data, but we can use the query param to ensure we use the name the frontend is sending
    if (user.role === 'trader' && trader) {
        user.traderName = trader;
    }

    return this.dashboardService.getSummary(year || new Date().getFullYear(), withGroups, user);
  }

  @Get('layout')
  async getLayout(@Request() req) {
    const user = req.user;
    return this.dashboardService.getLayout(user.id);
  }

  @Post('layout')
  async saveLayout(@Body() layout: any, @Request() req) {
    const user = req.user;
    return this.dashboardService.saveLayout(user.id, layout);
  }
}
