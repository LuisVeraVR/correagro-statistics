import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { sql, eq, and, notInArray, desc, gte, inArray } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

@Injectable()
export class BenchmarkService {
    constructor(@Inject(DRIZZLE) private readonly db: MySql2Database<typeof schema>) {}

    // Helper: Get map of Alias -> MainName
    private async getTraderAliasMap(): Promise<Map<string, string>> {
        const aliasMap = new Map<string, string>();
        
        // 1. Get all main traders
        const mainTraders = await this.db.select().from(schema.traders);
        const traderIdToName = new Map<number, string>();
        
        for (const t of mainTraders) {
            traderIdToName.set(t.id, t.nombre);
            aliasMap.set(t.nombre.toLowerCase(), t.nombre); // Map self
        }

        // 2. Get additional aliases
        const aliases = await this.db.select().from(schema.traderAdicionales);
        for (const a of aliases) {
            const mainName = traderIdToName.get(Number(a.traderId));
            if (mainName) {
                aliasMap.set(a.nombreAdicional.toLowerCase(), mainName);
            }
        }

        return aliasMap;
    }

    // Helper: Get all aliases for a list of Main Names
    private async getAliasesForTraders(mainNames: string[]): Promise<string[]> {
        const mainNamesLower = mainNames.map(n => n.toLowerCase());
        const allNames: string[] = [...mainNames]; // Start with main names

        // Find IDs of these traders
        const traders = await this.db.select()
            .from(schema.traders)
            .where(inArray(schema.traders.nombre, mainNames));
        
        const traderIds = traders.map(t => t.id);

        if (traderIds.length > 0) {
            const aliases = await this.db.select()
                .from(schema.traderAdicionales)
                .where(inArray(schema.traderAdicionales.traderId, traderIds));
            
            for (const a of aliases) {
                allNames.push(a.nombreAdicional);
            }
        }
        
        return allNames;
    }

    async getComparison(traders: string[], periodMonths: number) {
        const transactions = schema.orfsTransactions;
        
        // 1. Date Range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - periodMonths);

        // 2. Get all aliases for the requested traders to ensure we catch all their transactions
        const allAliases = await this.getAliasesForTraders(traders);

        if (allAliases.length === 0) {
            return {
                marketShare: [],
                volumeHistory: [],
                growth: [],
                gaps: null
            };
        }

        // 3. Fetch Transactions
        const rawData = await this.db.select({
            corredor: transactions.corredor,
            mes: transactions.mes,
            year: transactions.year,
            negociado: transactions.negociado,
            fecha: transactions.fecha
        })
        .from(transactions)
        .where(and(
            gte(transactions.fecha, startDate),
            inArray(transactions.corredor, allAliases)
        ));

        // 4. Normalize and Aggregate
        const aliasMap = await this.getTraderAliasMap();
        
        // Structure: MainName -> { total: 0, monthly: { 'Jan 2024': 100, ... } }
        const aggregator = new Map<string, { total: number, monthly: Map<string, number> }>();
        
        // Initialize for requested traders (so they appear even if 0)
        for (const t of traders) {
            aggregator.set(t, { total: 0, monthly: new Map() });
        }

        let grandTotal = 0;

        for (const row of rawData) {
            const mainName = aliasMap.get(row.corredor.toLowerCase()) || row.corredor;
            // Only aggregate if it maps to one of the requested traders (should be true due to where clause, but safety check)
            if (aggregator.has(mainName)) {
                const amount = Number(row.negociado || 0);
                const entry = aggregator.get(mainName)!;
                entry.total += amount;
                grandTotal += amount;

                // Month Key: YYYY-MM
                // We can use the 'mes' field or derive from fecha. 'mes' is string name in DB? 
                // Let's check DB schema... 'mes' is varchar. It might be 'Enero', 'Febrero'.
                // Ideally use YYYY-MM from fecha for sorting.
                const d = new Date(row.fecha as unknown as string);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                
                entry.monthly.set(monthKey, (entry.monthly.get(monthKey) || 0) + amount);
            }
        }

        // 5. Build Result Objects
        
        // Market Share (Pie)
        const marketShare = Array.from(aggregator.entries()).map(([name, data]) => ({
            name,
            value: data.total,
            percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0
        })).sort((a, b) => b.value - a.value);

        // Volume History (Line)
        // Need sorted list of all months in range
        const allMonths = new Set<string>();
        for (const data of aggregator.values()) {
            for (const m of data.monthly.keys()) allMonths.add(m);
        }
        const sortedMonths = Array.from(allMonths).sort();

        const volumeHistory = sortedMonths.map(month => {
            const point: any = { name: month }; // '2024-01'
            for (const [name, data] of aggregator.entries()) {
                point[name] = data.monthly.get(month) || 0;
            }
            return point;
        });

        // Growth (Simple: Last Month vs First Month in period? Or Period vs Prev Period?)
        // PHP says "Crecimiento". Usually (Total This Period - Total Prev Period) / Total Prev Period.
        // But we only queried "This Period".
        // Let's calculate growth based on linear trend or just First vs Last chunk?
        // PHP `calculateGrowth` implementation suggests comparing accumulated values.
        // For simplicity now: (Last 3 months avg - First 3 months avg) / First 3 months avg?
        // Or simply sum of this period.
        // Let's return Total Volume for now as "Growth" bar chart usually compares volumes side by side.
        const growth = marketShare.map(item => ({
            name: item.name,
            volume: item.value
        }));

        // Gaps (Brechas)
        // Target: Top Competitor in selection.
        // Me: Correagro S.A. (if in selection).
        let gaps = null;
        const myName = 'Correagro S.A.';
        if (aggregator.has(myName)) {
            const myVol = aggregator.get(myName)!.total;
            const top = marketShare[0]; // Already sorted desc
            
            if (top.name !== myName) {
                const diff = top.value - myVol;
                gaps = {
                    competitor: top.name,
                    amount: diff,
                    // Simple logic: If I grow at 5% per month, how long to catch up? 
                    // This is complex. Let's just send the gap amount for now.
                    monthsToReach: 0 // Placeholder
                };
            }
        }

        return {
            marketShare,
            volumeHistory,
            growth, // Renamed to simple volume comparison for now
            gaps
        };
    }

  async getSummary(year: number, month: string = 'latest', period: number = 6) {
    const transactions = schema.orfsTransactions;
    
    // 1. Get Totals (With Groups)
    const totalWithGroupsResult = await this.db
        .select({ total: sql<number>`sum(${transactions.negociado})` })
        .from(transactions)
        .where(eq(transactions.year, year));
    const totalWithGroups = Number(totalWithGroupsResult[0]?.total || 0);

    // 2. Get Totals (Without Groups)
    const totalWithoutGroupsResult = await this.db
        .select({ total: sql<number>`sum(${transactions.negociado})` })
        .from(transactions)
        .where(and(
            eq(transactions.year, year),
            notInArray(transactions.corredor, ['Grupo BIOS', 'Grupo Bavaria'])
        ));
    const totalWithoutGroups = Number(totalWithoutGroupsResult[0]?.total || 0);

    // 3. Active SCBs (count unique traders)
    const distinctTraders = await this.db
        .selectDistinct({ corredor: transactions.corredor })
        .from(transactions)
        .where(eq(transactions.year, year));
    
    // We should normalize aliases to count real active SCBs
    const aliasMap = await this.getTraderAliasMap();
    const uniqueSCBs = new Set<string>();
    for (const t of distinctTraders) {
        const mainName = aliasMap.get(t.corredor.toLowerCase()) || t.corredor;
        uniqueSCBs.add(mainName);
    }

    return {
        totalWithGroups,
        totalWithoutGroups,
        activeSCBs: uniqueSCBs.size,
        year
    };
  }

  async getRanking(year: number, month: string = 'all', limit: number = 50) {
    const transactions = schema.orfsTransactions;
    const conditions = [eq(transactions.year, year)];
    
    if (month !== 'all' && month !== 'latest') {
        conditions.push(eq(transactions.mes, month));
    }

    // Fetch raw data grouped by corredor
    const rawData = await this.db
        .select({
            corredor: transactions.corredor,
            volume: sql<number>`sum(${transactions.negociado})`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.corredor);

    // Normalize and aggregate
    const aliasMap = await this.getTraderAliasMap();
    const aggregated = new Map<string, number>();
    let totalMarketVolume = 0;

    for (const row of rawData) {
        const mainName = aliasMap.get(row.corredor.toLowerCase()) || row.corredor;
        const vol = Number(row.volume);
        aggregated.set(mainName, (aggregated.get(mainName) || 0) + vol);
        totalMarketVolume += vol;
    }

    // Convert to array and sort
    const ranking = Array.from(aggregated.entries()).map(([name, volume]) => ({
        name,
        volume,
        share: totalMarketVolume > 0 ? (volume / totalMarketVolume) * 100 : 0
    }));

    ranking.sort((a, b) => b.volume - a.volume);

    // Add Position
    return ranking.slice(0, limit).map((item, index) => ({
        ...item,
        position: index + 1
    }));
  }

  async getTrends(year: number) {
    const transactions = schema.orfsTransactions;
    
    // Fetch monthly volumes per trader
    const rawData = await this.db
        .select({
            corredor: transactions.corredor,
            mes: transactions.mes,
            volume: sql<number>`sum(${transactions.negociado})`,
        })
        .from(transactions)
        .where(eq(transactions.year, year))
        .groupBy(transactions.corredor, transactions.mes);

    const aliasMap = await this.getTraderAliasMap();
    
    // Structure: { [trader]: { [month]: volume } }
    const traderTrends: Record<string, Record<string, number>> = {};
    const marketTrends: Record<string, number> = {}; // { [month]: total }
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (const row of rawData) {
        const mainName = aliasMap.get(row.corredor.toLowerCase()) || row.corredor;
        const vol = Number(row.volume);
        const m = row.mes;

        if (!traderTrends[mainName]) traderTrends[mainName] = {};
        traderTrends[mainName][m] = (traderTrends[mainName][m] || 0) + vol;

        marketTrends[m] = (marketTrends[m] || 0) + vol;
    }

    // Prepare datasets for charts
    // 1. Share History (Correagro vs Others) - calculated on frontend usually, but we can help
    // 2. Growth
    
    return {
        market: marketTrends,
        traders: traderTrends,
        months
    };
  }

  async getCorreagroStats(year: number, traderName: string = 'Correagro S.A.') {
      // Get ranking to find position
      const ranking = await this.getRanking(year, 'all', 1000);
      const myRankIndex = ranking.findIndex(r => r.name.toLowerCase() === traderName.toLowerCase());
      
      if (myRankIndex === -1) return null;

      const myData = ranking[myRankIndex];
      const rank1 = ranking[0];
      const rank2 = ranking[1];
      const prevRank = ranking[myRankIndex - 1];

      return {
          position: myData.position,
          share: myData.share,
          gap1: rank1 ? rank1.volume - myData.volume : 0,
          gap2: rank2 ? rank2.volume - myData.volume : 0,
          volume: myData.volume,
          prevGap: prevRank ? prevRank.volume - myData.volume : 0
      };
  }

  async getSectors(year: number) {
      const transactions = schema.orfsTransactions;
      
      // Fetch all transactions for the year
      const rawData = await this.db.select({
          corredor: transactions.corredor,
          nombre: transactions.nombre, // Product name used for sector classification
          volume: transactions.negociado,
          year: transactions.year
      })
      .from(transactions)
      .where(inArray(transactions.year, [year, year - 1])); // Fetch current and prev year for growth

      const aliasMap = await this.getTraderAliasMap();
      
      // Structure: Sector -> { totalCurrent: 0, totalPrev: 0, traders: { Name -> { current: 0, prev: 0 } } }
      const sectorMap = new Map<string, {
          totalCurrent: number;
          totalPrev: number;
          traders: Map<string, { current: number; prev: number }>;
      }>();

      // Helper to classify sector
      const getSector = (name: string): string => {
          const p = (name || '').toLowerCase();
          if (p.includes('tes')) return 'Deuda Pública';
          if (p.includes('cdt')) return 'CDT';
          if (p.includes('accion') || p.includes('preferencial') || p.includes('pf ')) return 'Renta Variable';
          if (p.includes('repo')) return 'Repos';
          if (p.includes('ttv')) return 'TTV';
          if (p.includes('bono')) return 'Bonos';
          if (p.includes('simultanea')) return 'Simultáneas';
          if (p.includes('opcion')) return 'Opciones';
          if (p.includes('futuro')) return 'Futuros';
          return 'Otros';
      };

      for (const row of rawData) {
          const sector = getSector(row.nombre);
          const mainName = aliasMap.get(row.corredor.toLowerCase()) || row.corredor;
          const vol = Number(row.volume || 0);
          const isCurrentYear = row.year === year;

          if (!sectorMap.has(sector)) {
              sectorMap.set(sector, {
                  totalCurrent: 0,
                  totalPrev: 0,
                  traders: new Map()
              });
          }

          const sData = sectorMap.get(sector)!;
          if (isCurrentYear) sData.totalCurrent += vol;
          else sData.totalPrev += vol;

          if (!sData.traders.has(mainName)) {
              sData.traders.set(mainName, { current: 0, prev: 0 });
          }
          const tData = sData.traders.get(mainName)!;
          if (isCurrentYear) tData.current += vol;
          else tData.prev += vol;
      }

      // Build Result
      const results: any[] = [];
      const myName = 'Correagro S.A.';

      for (const [sector, sData] of sectorMap.entries()) {
          // Find Correagro data
          const myStats = sData.traders.get(myName) || { current: 0, prev: 0 };
          const myShare = sData.totalCurrent > 0 ? (myStats.current / sData.totalCurrent) * 100 : 0;
          
          // Calculate Growth (Correagro's growth in this sector or Sector Growth?)
          // Using Correagro's growth for now as per BCG matrix usually being product specific
          // But wait, BCG matrix X=Relative Market Share, Y=Market Growth Rate.
          // Market Growth Rate = (TotalCurrent - TotalPrev) / TotalPrev
          let marketGrowth = 0;
          if (sData.totalPrev > 0) {
              marketGrowth = ((sData.totalCurrent - sData.totalPrev) / sData.totalPrev) * 100; // Percentage
          } else if (sData.totalCurrent > 0) {
              marketGrowth = 100; // New sector
          }

          // Relative Market Share = My Share / Largest Competitor Share
          // But here we use absolute Share for X axis in many custom implementations.
          // The code used `item.corre.share` and `item.corre.growth`.
          // Let's assume growth is Market Growth.

          // Find Top Competitor
          let topCompetitor = { name: 'N/A', share: 0, volume: 0 };
          
          // Sort traders by current volume
          const sortedTraders = Array.from(sData.traders.entries())
              .map(([name, stats]) => ({
                  name,
                  volume: stats.current,
                  share: sData.totalCurrent > 0 ? (stats.current / sData.totalCurrent) * 100 : 0
              }))
              .sort((a, b) => b.volume - a.volume);

          if (sortedTraders.length > 0) {
              // Top competitor is the leader, unless I am the leader, then it's the second.
              // Actually the UI just asks for "Top Competitor".
              // Usually the one with highest share.
              const leader = sortedTraders[0];
              topCompetitor = {
                  name: leader.name,
                  share: leader.share,
                  volume: leader.volume
              };
          }

          // Classification
          let status = 'rezago';
          if (topCompetitor.name === myName) {
              status = 'lider';
          } else if (marketGrowth >= 5 && myShare >= 10) {
              status = 'oportunidad';
          }

          results.push({
              sector,
              corre: {
                  scb: myName,
                  share: myShare,
                  growth: marketGrowth, // Using Market Growth
                  volume: myStats.current
              },
              top: {
                  scb: topCompetitor.name,
                  share: topCompetitor.share,
                  volume: topCompetitor.volume
              },
              status
          });
      }

      return results;
  }

  async getProducts(year: number) {
    const columnsResult = await this.db.execute(sql`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bmc_productos_sector'`);
    const rawColumns = Array.isArray(columnsResult) ? columnsResult : (columnsResult as any).rows ?? [];
    const columnNames = rawColumns.map((row: any) => String(row.COLUMN_NAME || row.column_name || row.columnName || ''));
    const montoCandidates = ['monto_millones', 'monto_mm', 'monto_millon', 'monto', 'volumen', 'valor'];
    const montoColumn = montoCandidates.find(c => columnNames.includes(c));
    const montoExpr = montoColumn === 'monto_millones'
        ? schema.bmcProductosSector.montoMillones
        : montoColumn
            ? sql<number>`${sql.raw(`bmc_productos_sector.${montoColumn}`)}`
            : sql<number>`0`;

    const rows = await this.db.select({
        producto: schema.bmcProductosSector.producto,
        sector: schema.bmcProductosSector.sector,
        montoMillones: montoExpr,
        participacionPct: schema.bmcProductosSector.participacionPct,
        variacionPct: schema.bmcProductosSector.variacionPct,
        fechaCarga: schema.bmcReportes.fechaCarga
    })
    .from(schema.bmcProductosSector)
    .innerJoin(schema.bmcReportes, eq(schema.bmcProductosSector.reporteId, schema.bmcReportes.id))
    .where(sql`YEAR(${schema.bmcReportes.fechaCarga}) = ${year}`);

    // Aggregate similar to PHP implementation
    const aggregated = new Map<string, {
        producto: string;
        sector: string;
        monto: number;
        partSum: number;
        varSum: number;
        count: number;
    }>();

    for (const row of rows) {
        const p = row.producto || 'N/D';
        const s = row.sector || 'N/D';
        const key = `${p.toLowerCase()}|${s.toLowerCase()}`;
        
        if (!aggregated.has(key)) {
            aggregated.set(key, {
                producto: p,
                sector: s,
                monto: 0,
                partSum: 0,
                varSum: 0,
                count: 0
            });
        }
        
        const item = aggregated.get(key)!;
        item.monto += Number(row.montoMillones || 0);
        item.partSum += Number(row.participacionPct || 0);
        item.varSum += Number(row.variacionPct || 0);
        item.count++;
    }

    const results = Array.from(aggregated.values()).map(item => ({
        producto: item.producto,
        sector: item.sector,
        monto_millones: item.monto,
        participacion_pct: item.count > 0 ? item.partSum / item.count : 0,
        variacion_pct: item.count > 0 ? item.varSum / item.count : 0
    }));

    // Sort by volume descending
    return results.sort((a, b) => b.monto_millones - a.monto_millones);
  }
}
