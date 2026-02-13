import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('clients')
  async getClients(@Query('year') year: number, @Request() req) {
    return this.reportsService.getClients(year, req.user);
  }

  @Get('orfs')
  async getOrfsReport(
    @Query('year') year: number,
    @Query('month') month: string, // 'all' or specific month
    @Query('trader') trader: string, // 'all' or specific trader name
    @Query('client') client: string, // 'all' or specific client name
    @Query('withGroups') withGroupsStr: string,
    @Request() req,
  ) {
    const withGroups = withGroupsStr !== 'false';
    return this.reportsService.getOrfsReport(year, month, trader, client, withGroups, req.user);
  }

  @Get('margin')
  async getMarginReport(
    @Query('year') year: number,
    @Query('month') month: string,
    @Query('trader') trader: string,
    @Query('client') client: string,
    @Query('withGroups') withGroupsStr: string,
    @Request() req,
  ) {
    const withGroups = withGroupsStr !== 'false';
    return this.reportsService.getMarginReport(year, month, trader, client, withGroups, req.user);
  }

  @Get('ruedas-options')
  async getRuedasOptions(@Query('year') year: number) {
    return this.reportsService.getRuedasOptions(year);
  }

  @Get('ruedas')
  async getRuedasReport(
    @Query('year') year: number,
    @Query('ruedas') ruedas: string,
    @Query('withGroups') withGroupsStr: string,
    @Request() req,
  ) {
    const withGroups = withGroupsStr !== 'false';
    return this.reportsService.getRuedasReport(year, ruedas, withGroups, req.user);
  }

  @Get('daily')
  async getDailyReport(
    @Query('year') year: number,
    @Query('month') month: string,
    @Query('rueda') rueda: string,
    @Query('client') client: string,
    @Query('withGroups') withGroupsStr: string,
    @Request() req,
  ) {
    const withGroups = withGroupsStr !== 'false';
    return this.reportsService.getDailyReport(year, month, rueda, client, withGroups, req.user);
  }
}
