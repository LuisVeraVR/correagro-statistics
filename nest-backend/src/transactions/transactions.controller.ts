import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.transactionsService.processUpload(file);
  }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll(@Query('year') year?: string) {
    return this.transactionsService.findAll(year ? +year : undefined);
  }

  @Get('summary/daily')
  getDailySummary(@Query('year') year: string, @Query('month') month?: string) {
    return this.transactionsService.getDailySummary(+year, month);
  }

  @Get('summary/ruedas')
  getRuedasSummary(@Query('year') year: string) {
    return this.transactionsService.getRuedasSummary(+year);
  }

  @Get('reports/margin')
  getMarginReport(@Query('year') year: string) {
    return this.transactionsService.getMarginData(+year);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }
}
