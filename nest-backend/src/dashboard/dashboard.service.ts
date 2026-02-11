import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import * as schema from '../drizzle/schema';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { sql, eq, desc, asc, and, inArray, notInArray } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}

  async getSummary(year: number, withGroups: boolean, user?: any) {
    const transactions = schema.orfsTransactions;
    const whereClause = await this.buildWhereClause(year, user, withGroups);

    // Total Volume & Commission & Transactions
    const totalsResult = await this.db
      .select({ 
        volume: sql<number>`sum(${transactions.negociado})`,
        commission: sql<number>`sum(${transactions.comiCorr})`,
        count: sql<number>`count(*)`,
        ruedas: sql<number>`count(distinct ${transactions.ruedaNo})`
      })
      .from(transactions)
      .where(whereClause);
    
    const total_volume = Number(totalsResult[0]?.volume || 0);
    const total_commission = Number(totalsResult[0]?.commission || 0);
    const total_transactions = Number(totalsResult[0]?.count || 0);
    const total_ruedas = Number(totalsResult[0]?.ruedas || 0);

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

  async getRanking(type: string, order: 'asc' | 'desc', year: number, user: any, withGroups: boolean) {
    const transactions = schema.orfsTransactions;
    const whereClause = await this.buildWhereClause(year, user, withGroups);
    
    let groupByField;
    let sumField;

    switch (type) {
        case 'traders_volume':
            groupByField = transactions.corredor;
            sumField = transactions.negociado;
            break;
        case 'traders_commission':
            groupByField = transactions.corredor;
            sumField = transactions.comiCorr;
            break;
        case 'clients_volume':
            groupByField = transactions.nombre;
            sumField = transactions.negociado;
            break;
        case 'clients_commission':
            groupByField = transactions.nombre;
            sumField = transactions.comiCorr;
            break;
        default:
            throw new Error('Invalid ranking type');
    }

    const orderByClause = order === 'asc' ? asc(sql`sum(${sumField})`) : desc(sql`sum(${sumField})`);

    const result = await this.db
        .select({
            name: groupByField,
            value: sql<number>`sum(${sumField})`
        })
        .from(transactions)
        .where(whereClause)
        .groupBy(groupByField)
        .orderBy(orderByClause)
        .limit(5);

    return result.map(r => ({ name: r.name, value: Number(r.value) }));
  }

  private async buildWhereClause(year: number, user: any, withGroups: boolean = true) {
    const transactions = schema.orfsTransactions;
    let whereClause = eq(transactions.year, year);

    if (user && user.role === 'trader' && user.traderName) {
        const traderRecord = await this.db
          .select()
          .from(schema.traders)
          .where(eq(schema.traders.nombre, user.traderName))
          .limit(1);

        let allNames = [user.traderName];

        if (traderRecord.length > 0) {
            const traderId = traderRecord[0].id;
            const additionalRecords = await this.db
              .select({ name: schema.traderAdicionales.nombreAdicional })
              .from(schema.traderAdicionales)
              .where(eq(schema.traderAdicionales.traderId, traderId));
            
            if (additionalRecords.length > 0) {
              allNames = [...allNames, ...additionalRecords.map(r => r.name)];
            }
        }
        
        whereClause = and(eq(transactions.year, year), inArray(transactions.corredor, allNames))!;
    } else if (!withGroups) {
        whereClause = and(
          eq(transactions.year, year),
          notInArray(transactions.corredor, ['Grupo BIOS', 'Grupo Bavaria'])
        )!;
    }
    return whereClause;
  }

  async getLayout(userId: number) {
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
}
