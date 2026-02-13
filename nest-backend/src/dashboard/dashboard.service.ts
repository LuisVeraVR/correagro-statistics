import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import * as schema from '../drizzle/schema';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { sql, eq, desc, and, inArray, notInArray } from 'drizzle-orm';
import { TradersService } from '../traders/traders.service';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<typeof schema>,
    private tradersService: TradersService
  ) {}

  async getSummary(year: number, withGroups: boolean, user?: any) {
    const transactions = schema.orfsTransactions;
    
    let whereClause = eq(transactions.year, year);
    if (user && user.role === 'trader' && user.traderName) {
        const aliases = await this.getTraderAliases([user.traderName.trim()]);
        console.log(`[DashboardService] Trader: ${user.traderName}, Aliases found: ${JSON.stringify(aliases)}`);
        whereClause = and(eq(transactions.year, year), inArray(transactions.corredor, aliases))!;
    } else if (!withGroups) {
        // Admin filter: Exclude special groups
        whereClause = and(
          eq(transactions.year, year),
          notInArray(transactions.corredor, ['Grupo BIOS', 'Grupo Bavaria'])
        )!;
    }

    // KPIs
    const kpisResult = await this.db
      .select({
        totalVolume: sql<number>`sum(${transactions.negociado})`,
        totalCommission: sql<number>`sum(${transactions.comiCorr})`,
        totalTransactions: sql<number>`count(*)`,
        totalRuedas: sql<number>`count(distinct ${transactions.ruedaNo})`
      })
      .from(transactions)
      .where(whereClause);
    
    const total_volume = Number(kpisResult[0]?.totalVolume || 0);
    const total_commission = Number(kpisResult[0]?.totalCommission || 0);
    const total_transactions = Number(kpisResult[0]?.totalTransactions || 0);
    const total_ruedas = Number(kpisResult[0]?.totalRuedas || 0);

    // Active Traders (Unique Corredores)
    const activeTradersResult = await this.db
      .select({ count: sql<number>`count(distinct ${transactions.corredor})` })
      .from(transactions)
      .where(whereClause);

    const active_traders = Number(activeTradersResult[0]?.count || 0);

    // Top Traders by Volume
    const traders_by_volume = await this.db
      .select({
        name: transactions.corredor,
        value: sql<number>`sum(${transactions.negociado})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.corredor)
      .orderBy(desc(sql`sum(${transactions.negociado})`))
      .limit(5);

    // Top Traders by Commission
    const traders_by_commission = await this.db
      .select({
        name: transactions.corredor,
        value: sql<number>`sum(${transactions.comiCorr})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.corredor)
      .orderBy(desc(sql`sum(${transactions.comiCorr})`))
      .limit(5);

    // Top Clients by Volume
    const clients_by_volume = await this.db
      .select({
        name: transactions.nombre,
        value: sql<number>`sum(${transactions.negociado})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.nombre)
      .orderBy(desc(sql`sum(${transactions.negociado})`))
      .limit(5);

    // Top Clients by Commission
    const clients_by_commission = await this.db
      .select({
        name: transactions.nombre,
        value: sql<number>`sum(${transactions.comiCorr})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.nombre)
      .orderBy(desc(sql`sum(${transactions.comiCorr})`))
      .limit(5);

    // Monthly Trend / Summary
    const monthly_summary = await this.db
      .select({
        month: transactions.mes,
        volume: sql<number>`sum(${transactions.negociado})`,
        commission: sql<number>`sum(${transactions.comiCorr})`,
        transactions: sql<number>`count(*)`,
        ruedas: sql<number>`count(distinct ${transactions.ruedaNo})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.mes)
      .orderBy(sql`min(${transactions.fecha})`); 

    return {
      year,
      kpis: {
        total_volume,
        total_commission,
        total_transactions,
        total_ruedas,
        active_traders
      },
      rankings: {
        traders_by_volume: traders_by_volume.map(t => ({ name: t.name, value: Number(t.value) })),
        traders_by_commission: traders_by_commission.map(t => ({ name: t.name, value: Number(t.value) })),
        clients_by_volume: clients_by_volume.map(t => ({ name: t.name, value: Number(t.value) })),
        clients_by_commission: clients_by_commission.map(t => ({ name: t.name, value: Number(t.value) })),
      },
      monthly_summary: monthly_summary.map(m => ({
        month: m.month,
        volume: Number(m.volume),
        commission: Number(m.commission),
        transactions: Number(m.transactions),
        ruedas: Number(m.ruedas)
      }))
    };
  }

  async getLayout(userId: number) {
    // Mock layout retrieval
    return {
      userId,
      widgets: [
        { id: 'volume_chart', x: 0, y: 0, w: 6, h: 4 },
        { id: 'top_traders', x: 6, y: 0, w: 6, h: 4 },
      ]
    };
  }

  async saveLayout(userId: number, layout: any) {
    console.log(`Saving layout for user ${userId}:`, layout);
    return { success: true };
  }

  private async getTraderAliases(traderNames: string[]): Promise<string[]> {
    if (traderNames.length === 0) return [];
    
    // Find trader IDs
    const traders = await this.db.select().from(schema.traders).where(inArray(schema.traders.nombre, traderNames));
    const traderIds = traders.map(t => t.id);
    const foundNames = traders.map(t => t.nombre);
    
    if (traderIds.length === 0) return traderNames;

    // Find aliases
    const aliases = await this.tradersService.getAdicionalesByTraderIds(traderIds);
    return [...foundNames, ...aliases.map(a => a.nombreAdicional)];
  }
}
