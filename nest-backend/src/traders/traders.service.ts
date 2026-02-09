import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { traders } from '../drizzle/schema';
import * as schema from '../drizzle/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class TradersService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}

  async create(data: CreateTraderDto) {
    return this.db.insert(traders).values(data);
  }

  async findAll() {
    return this.db.select().from(traders).orderBy(desc(traders.createdAt));
  }

  async findById(id: number) {
    const result = await this.db.select().from(traders).where(eq(traders.id, id));
    return result[0];
  }

  async update(id: number, data: UpdateTraderDto) {
    return this.db.update(traders).set(data).where(eq(traders.id, id));
  }

  async remove(id: number) {
    return this.db.delete(traders).where(eq(traders.id, id));
  }

  async addAdicional(traderId: number, nombreAdicional: string) {
    return this.db.insert(schema.traderAdicionales).values({
      traderId,
      nombreAdicional,
    });
  }

  async removeAdicional(id: number) {
    return this.db.delete(schema.traderAdicionales).where(eq(schema.traderAdicionales.id, id));
  }

  async getAdicionales(traderId: number) {
    return this.db
      .select()
      .from(schema.traderAdicionales)
      .where(eq(schema.traderAdicionales.traderId, traderId));
  }

  async getAdicionalesByTraderIds(traderIds: number[]) {
    if (traderIds.length === 0) return [];
    return this.db
      .select()
      .from(schema.traderAdicionales)
      .where(inArray(schema.traderAdicionales.traderId, traderIds));
  }
}
