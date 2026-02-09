import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getDashboardSummary(@Query('year') year: number, @Query('withGroups') withGroupsStr: string, @Request() req) {
    const user = req.user;
    const withGroups = withGroupsStr !== 'false'; // Default to true
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
