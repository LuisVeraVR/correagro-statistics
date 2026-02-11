import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { orfsTransactions } from '../drizzle/schema';
import * as schema from '../drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as XLSX from 'xlsx';

@Injectable()
export class TransactionsService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}

  async processUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { dateNF: 'yyyy-mm-dd' });

    if (!data.length) {
      throw new BadRequestException('Empty file');
    }

    const transactionsToInsert = data.map((row: any) => {
      // Map Excel columns to DB schema
      
      let fecha: Date;
      const rawFecha = row['FECHA'];

      if (rawFecha instanceof Date) {
        fecha = rawFecha;
      } else if (typeof rawFecha === 'string') {
        // Try to parse "DD/MM/YYYY" or "YYYY-MM-DD"
        if (rawFecha.includes('/')) {
            const parts = rawFecha.split('/');
            // Assume DD/MM/YYYY
            if (parts.length === 3) {
                fecha = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
                fecha = new Date(rawFecha);
            }
        } else {
            fecha = new Date(rawFecha);
        }
      } else if (typeof rawFecha === 'number') {
        // Handle Excel serial date manually if cellDates didn't work for some reason
        // (val - 25569) * 86400 * 1000
        fecha = new Date((rawFecha - 25569) * 86400 * 1000);
      } else {
        fecha = new Date();
      }

      if (isNaN(fecha.getTime())) {
        fecha = new Date(); // Fallback to now if invalid
      }
      
      // Adjust for timezone offset if needed (Excel dates are often local 00:00)
      // But we will store as is.
      
      const parseNumber = (val: any) => {
        const n = Number(val);
        return isNaN(n) ? 0 : n;
      };

      const parseDecimal = (val: any) => {
        if (!val) return '0';
        // Remove commas if present (e.g. "1,234.56")
        const clean = String(val).replace(/,/g, '');
        const n = Number(clean);
        return isNaN(n) ? '0' : String(n);
      };

      return {
        reasig: row['REASIG'] || '',
        nit: String(row['NIT'] || ''),
        nombre: String(row['NOMBRE'] || ''),
        corredor: String(row['CORREDOR'] || ''),
        comiPorcentual: parseDecimal(row['COMI_PORCENTUAL']),
        ciudad: row['CIUDAD'] || '',
        fecha: fecha,
        ruedaNo: parseNumber(row['RUEDA_NO'] || row['RUEDA']), // Support both RUEDA_NO and RUEDA
        negociado: parseDecimal(row['NEGOCIADO']),
        comiBna: parseDecimal(row['COMI_BNA']),
        campo209: parseDecimal(row['CAMPO209']),
        comiCorr: parseDecimal(row['COMI_CORR']),
        ivaBna: parseDecimal(row['IVA_BNA']),
        ivaComi: parseDecimal(row['IVA_COMI']),
        ivaCama: parseDecimal(row['IVA_CAMA']),
        facturado: parseDecimal(row['FACTURADO']),
        mes: row['MES'] || '',
        comiCorrNeto: parseDecimal(row['COMI_CORR_NETO']),
        year: fecha.getFullYear()
      };
    });

    // Batch insert
    // Drizzle insert many
    try {
        const BATCH_SIZE = 500;
        for (let i = 0; i < transactionsToInsert.length; i += BATCH_SIZE) {
            const batch = transactionsToInsert.slice(i, i + BATCH_SIZE);
            await this.db.insert(orfsTransactions).values(batch);
        }
        return { message: 'File processed successfully', count: transactionsToInsert.length };
    } catch (error) {
        console.error('Error inserting transactions:', error);
        throw new BadRequestException('Failed to process transactions: ' + error.message);
    }
  }

  async create(data: CreateTransactionDto) {
    return this.db.insert(orfsTransactions).values({
        ...data,
        fecha: new Date(data.fecha)
    });
  }

  async findAll(year?: number) {
    if (year) {
        return this.db.select().from(orfsTransactions).where(eq(orfsTransactions.year, year)).orderBy(desc(orfsTransactions.fecha));
    }
    return this.db.select().from(orfsTransactions).orderBy(desc(orfsTransactions.fecha));
  }

  async findById(id: number) {
    const result = await this.db.select().from(orfsTransactions).where(eq(orfsTransactions.id, id));
    return result[0];
  }

  async update(id: number, data: UpdateTransactionDto) {
    const updateData: any = { ...data };
    if (data.fecha) {
        updateData.fecha = new Date(data.fecha);
    }
    return this.db.update(orfsTransactions).set(updateData).where(eq(orfsTransactions.id, id));
  }

  async remove(id: number) {
    return this.db.delete(orfsTransactions).where(eq(orfsTransactions.id, id));
  }

  async getDailySummary(year: number, month?: string) {
    let whereClause = eq(orfsTransactions.year, year);
    if (month) {
        whereClause = and(eq(orfsTransactions.year, year), eq(orfsTransactions.mes, month))!;
    }

    return this.db.select({
        fecha: orfsTransactions.fecha,
        totalNegociado: sql<number>`sum(${orfsTransactions.negociado})`,
        count: sql<number>`count(*)`
    })
    .from(orfsTransactions)
    .where(whereClause)
    .groupBy(orfsTransactions.fecha)
    .orderBy(desc(orfsTransactions.fecha));
  }

  async getRuedasSummary(year: number) {
      return this.db.select({
          ruedaNo: orfsTransactions.ruedaNo,
          totalNegociado: sql<number>`sum(${orfsTransactions.negociado})`,
          count: sql<number>`count(*)`
      })
      .from(orfsTransactions)
      .where(eq(orfsTransactions.year, year))
      .groupBy(orfsTransactions.ruedaNo)
      .orderBy(desc(orfsTransactions.ruedaNo));
  }

  async getMarginData(year: number) {
      return this.db.select({
          corredor: orfsTransactions.corredor,
          nit: orfsTransactions.nit,
          cliente: orfsTransactions.nombre,
          mes: orfsTransactions.mes,
          transado: sql<number>`sum(${orfsTransactions.negociado})`,
          comision: sql<number>`sum(${orfsTransactions.comiCorr})`,
          margen: sql<number>`sum(${orfsTransactions.comiCorr} - ${orfsTransactions.comiBna})`
      })
      .from(orfsTransactions)
      .where(eq(orfsTransactions.year, year))
      .groupBy(orfsTransactions.corredor, orfsTransactions.nit, orfsTransactions.nombre, orfsTransactions.mes)
      .orderBy(orfsTransactions.corredor, orfsTransactions.nombre);
  }
}

