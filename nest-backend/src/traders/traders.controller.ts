import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TradersService } from './traders.service';
import { CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('traders')
@UseGuards(JwtAuthGuard)
export class TradersController {
  constructor(private readonly tradersService: TradersService) {}

  @Post()
  create(@Body() createTraderDto: CreateTraderDto) {
    return this.tradersService.create(createTraderDto);
  }

  @Get()
  findAll() {
    return this.tradersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tradersService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTraderDto: UpdateTraderDto) {
    return this.tradersService.update(+id, updateTraderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tradersService.remove(+id);
  }

  @Post(':id/adicionales')
  addAdicional(@Param('id') id: string, @Body('nombreAdicional') nombreAdicional: string) {
    return this.tradersService.addAdicional(+id, nombreAdicional);
  }

  @Get(':id/adicionales')
  getAdicionales(@Param('id') id: string) {
    return this.tradersService.getAdicionales(+id);
  }

  @Delete('adicionales/:id')
  removeAdicional(@Param('id') id: string) {
    return this.tradersService.removeAdicional(+id);
  }
}
