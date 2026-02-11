import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import * as schema from '../drizzle/schema';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { sql, eq, and, like, inArray, notInArray, desc } from 'drizzle-orm';
import { TradersService } from '../traders/traders.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<typeof schema>,
    private tradersService: TradersService
  ) {}

  async getRuedasOptions(year: number) {
    const transactions = schema.orfsTransactions;
    return this.db
      .selectDistinct({
        ruedaNo: transactions.ruedaNo,
        fecha: transactions.fecha
      })
      .from(transactions)
      .where(eq(transactions.year, year))
      .orderBy(desc(transactions.ruedaNo));
  }

  async getRuedasReport(year: number, ruedas: string, withGroups: boolean, user: any) {
     const transactions = schema.orfsTransactions;
     const conditions = [eq(transactions.year, year)];

     if (ruedas && ruedas !== 'all') {
         const ruedaList = ruedas.split(',').map(Number);
         conditions.push(inArray(transactions.ruedaNo, ruedaList));
     }

     // RBAC
     let allowedTraders: string[] = [];
     if (user.role === 'trader' && user.traderName) {
         allowedTraders = [user.traderName];
     }
     if (allowedTraders.length > 0) {
         const aliases = await this.getTraderAliases(allowedTraders);
         conditions.push(inArray(transactions.corredor, aliases));
     } else if (!withGroups) {
         // Admin filter: Exclude special groups
         conditions.push(notInArray(transactions.corredor, ['Grupo BIOS', 'Grupo Bavaria']));
     }

     const whereClause = and(...conditions);

     // KPIs
     const kpisResult = await this.db
        .select({
            totalVolume: sql<number>`sum(${transactions.negociado})`,
            totalCommission: sql<number>`sum(${transactions.comiCorr})`,
            uniqueClients: sql<number>`count(distinct ${transactions.nombre})`,
            uniqueTraders: sql<number>`count(distinct ${transactions.corredor})`
        })
        .from(transactions)
        .where(whereClause);

     const kpis = {
         totalVolume: Number(kpisResult[0]?.totalVolume || 0),
         totalCommission: Number(kpisResult[0]?.totalCommission || 0),
         totalClients: Number(kpisResult[0]?.uniqueClients || 0),
         totalTraders: Number(kpisResult[0]?.uniqueTraders || 0),
         avgMargin: 0
     };
     if (kpis.totalVolume > 0) {
         kpis.avgMargin = (kpis.totalCommission / kpis.totalVolume) * 100;
     }

     // Data grouped by Trader
     const rawData = await this.db
        .select({
            corredor: transactions.corredor,
            volumen: sql<number>`sum(${transactions.negociado})`,
            comision: sql<number>`sum(${transactions.comiCorr})`,
            clientsCount: sql<number>`count(distinct ${transactions.nombre})`
        })
        .from(transactions)
        .where(whereClause)
        .groupBy(transactions.corredor)
        .orderBy(desc(sql`sum(${transactions.negociado})`));

     const data = rawData.map(row => ({
         corredor: row.corredor,
         totalVolume: Number(row.volumen),
         totalCommission: Number(row.comision),
         avgMargin: Number(row.volumen) > 0 ? (Number(row.comision) / Number(row.volumen)) * 100 : 0,
         clientCount: Number(row.clientsCount)
     }));

     return { kpis, data };
  }

  async getDailyReport(year: number, month: string, rueda: string, client: string, withGroups: boolean, user: any) {
    const whereClause = await this.buildWhereClause(year, month, 'all', client, withGroups, user);
    const transactions = schema.orfsTransactions;
    const extraConditions = [];
    if (rueda && rueda !== 'all') {
        extraConditions.push(eq(transactions.ruedaNo, Number(rueda)));
    }

    const finalWhere = extraConditions.length > 0 ? and(whereClause, ...extraConditions) : whereClause;

    const rawData = await this.db
        .select({
            cliente: transactions.nombre,
            ruedaNo: transactions.ruedaNo,
            volumen: sql<number>`sum(${transactions.negociado})`
        })
        .from(transactions)
        .where(finalWhere)
        .groupBy(transactions.nombre, transactions.ruedaNo)
        .orderBy(transactions.nombre, transactions.ruedaNo);
    
    // Pivot
    const result = {};
    const allRuedas = new Set<number>();

    rawData.forEach(row => {
        if (!result[row.cliente]) {
            result[row.cliente] = { name: row.cliente, wheels: {} };
        }
        result[row.cliente].wheels[row.ruedaNo] = Number(row.volumen);
        allRuedas.add(row.ruedaNo);
    });

    return {
        ruedas: Array.from(allRuedas).sort((a, b) => a - b),
        data: Object.values(result)
    };
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

  private async buildWhereClause(year: number, month: string, trader: string, client: string, withGroups: boolean, user: any) {
    const transactions = schema.orfsTransactions;
    const conditions = [eq(transactions.year, year)];

    if (month && month !== 'all') {
      conditions.push(eq(transactions.mes, month));
    }

    // Role-based filtering
    let allowedTraders: string[] = [];
    if (user.role === 'trader' && user.traderName) {
        allowedTraders = [user.traderName];
    } else if (trader && trader !== 'all') {
        allowedTraders = trader.split(',');
    }

    if (allowedTraders.length > 0) {
        const aliases = await this.getTraderAliases(allowedTraders);
        conditions.push(inArray(transactions.corredor, aliases));
    } else if (!withGroups) {
        // Admin filter: Exclude special groups
        conditions.push(notInArray(transactions.corredor, ['Grupo BIOS', 'Grupo Bavaria']));
    }

    if (client && client !== 'all') {
      const clientList = client.split(',');
      conditions.push(inArray(transactions.nombre, clientList));
    }

    return and(...conditions);
  }

  async getClients(year: number) {
    const transactions = schema.orfsTransactions;
    const result = await this.db
        .selectDistinct({ nombre: transactions.nombre })
        .from(transactions)
        .where(eq(transactions.year, year))
        .orderBy(transactions.nombre);
    return result.map(r => r.nombre);
  }

  async getOrfsReport(year: number, month: string, trader: string, client: string, withGroups: boolean, user: any) {
    const whereClause = await this.buildWhereClause(year, month, trader, client, withGroups, user);
    const transactions = schema.orfsTransactions;

    // Get raw data grouped by Corredor, Cliente, Mes
    const rawData = await this.db
      .select({
        corredor: transactions.corredor,
        cliente: transactions.nombre,
        nit: transactions.nit,
        mes: transactions.mes,
        volumen: sql<number>`sum(${transactions.negociado})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.corredor, transactions.nombre, transactions.mes)
      .orderBy(transactions.corredor, transactions.nombre);

    // Process data into hierarchical structure
    const groupedData = {};
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    rawData.forEach(row => {
      if (!groupedData[row.corredor]) {
        groupedData[row.corredor] = {
          corredor: row.corredor,
          clients: {},
          totalVolume: 0,
          clientCount: 0
        };
      }

      if (!groupedData[row.corredor].clients[row.cliente]) {
        groupedData[row.corredor].clients[row.cliente] = {
            nit: row.nit,
            name: row.cliente,
            months: {},
            total: 0
        };
        // Initialize months
        months.forEach(m => groupedData[row.corredor].clients[row.cliente].months[m] = 0);
        groupedData[row.corredor].clientCount++;
      }

      const vol = Number(row.volumen);
      groupedData[row.corredor].clients[row.cliente].months[row.mes] = vol;
      groupedData[row.corredor].clients[row.cliente].total += vol;
      groupedData[row.corredor].totalVolume += vol;
    });

    // Convert object to array
    return Object.values(groupedData).map((g: any) => ({
        ...g,
        clients: Object.values(g.clients)
    }));
  }

  async getMarginReport(year: number, month: string, trader: string, client: string, withGroups: boolean, user: any) {
    const whereClause = await this.buildWhereClause(year, month, trader, client, withGroups, user);
    const transactions = schema.orfsTransactions;

    // KPIs
    const kpisResult = await this.db
        .select({
            totalVolume: sql<number>`sum(${transactions.negociado})`,
            totalCommission: sql<number>`sum(${transactions.comiBna})`,
            uniqueClients: sql<number>`count(distinct ${transactions.nombre})`
        })
        .from(transactions)
        .where(whereClause);

    const kpis = {
        totalVolume: Number(kpisResult[0]?.totalVolume || 0),
        totalCommission: Number(kpisResult[0]?.totalCommission || 0),
        totalClients: Number(kpisResult[0]?.uniqueClients || 0),
        avgMargin: 0
    };
    
    if (kpis.totalVolume > 0) {
        kpis.avgMargin = (kpis.totalCommission / kpis.totalVolume) * 100;
    }

    // Detailed Data
    const rawData = await this.db
      .select({
        corredor: transactions.corredor,
        cliente: transactions.nombre,
        nit: transactions.nit,
        mes: transactions.mes,
        volumen: sql<number>`sum(${transactions.negociado})`,
        comision: sql<number>`sum(${transactions.comiBna})`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.corredor, transactions.nombre, transactions.mes)
      .orderBy(transactions.corredor, transactions.nombre);

     // Process data into hierarchical structure
     const groupedData = {};
     const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
 
     rawData.forEach(row => {
       if (!groupedData[row.corredor]) {
         groupedData[row.corredor] = {
           corredor: row.corredor,
           clients: {},
           totalVolume: 0,
           totalCommission: 0,
           clientCount: 0
         };
       }
 
       if (!groupedData[row.corredor].clients[row.cliente]) {
         groupedData[row.corredor].clients[row.cliente] = {
             nit: row.nit,
             name: row.cliente,
             months: {},
             totalVolume: 0,
             totalCommission: 0
         };
         // Initialize months
         months.forEach(m => groupedData[row.corredor].clients[row.cliente].months[m] = { volume: 0, commission: 0, margin: 0 });
         groupedData[row.corredor].clientCount++;
       }
 
       const vol = Number(row.volumen);
       const com = Number(row.comision);
       const margin = vol > 0 ? (com / vol) * 100 : 0;
 
       groupedData[row.corredor].clients[row.cliente].months[row.mes] = { volume: vol, commission: com, margin };
       groupedData[row.corredor].clients[row.cliente].totalVolume += vol;
       groupedData[row.corredor].clients[row.cliente].totalCommission += com;
       
       groupedData[row.corredor].totalVolume += vol;
       groupedData[row.corredor].totalCommission += com;
     });
 
     // Calculate Group Margins and Client Total Margins
     const result = Object.values(groupedData).map((g: any) => {
        const groupMargin = g.totalVolume > 0 ? (g.totalCommission / g.totalVolume) * 100 : 0;
        
        const clients = Object.values(g.clients).map((c: any) => ({
            ...c,
            totalMargin: c.totalVolume > 0 ? (c.totalCommission / c.totalVolume) * 100 : 0
        }));

        return {
            ...g,
            avgMargin: groupMargin,
            clients
        };
     });

     return {
         kpis,
         data: result
     };
  }
}
