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

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      throw new BadRequestException('Empty file');
    }

    const transactionsToInsert = data.map((row: any) => {
      // Map Excel columns to DB schema
      // This mapping assumes standard column names from the old system or needs adjustment
      // Assuming headers: FECHA, RUEDA, NIT, NOMBRE, CORREDOR, PRODUCTO, etc.
      
      const fecha = row['FECHA'] ? new Date(row['FECHA']) : new Date();
      // Handle Excel serial date if necessary, but sheet_to_json usually handles it if cell type is correct
      
      return {
        reasig: row['REASIG'] || '',
        nit: String(row['NIT'] || ''),
        nombre: String(row['NOMBRE'] || ''),
        corredor: String(row['CORREDOR'] || ''),
        comiPorcentual: String(row['COMI_PORCENTUAL'] || '0'),
        ciudad: row['CIUDAD'] || '',
        fecha: fecha,
        ruedaNo: Number(row['RUEDA'] || 0),
        negociado: String(row['NEGOCIADO'] || '0'),
        comiBna: String(row['COMI_BNA'] || '0'),
        campo209: String(row['CAMPO209'] || '0'),
        comiCorr: String(row['COMI_CORR'] || '0'),
        ivaBna: String(row['IVA_BNA'] || '0'),
        ivaComi: String(row['IVA_COMI'] || '0'),
        ivaCama: String(row['IVA_CAMA'] || '0'),
        facturado: String(row['FACTURADO'] || '0'),
        mes: row['MES'] || '',
        comiCorrNeto: String(row['COMI_CORR_NETO'] || '0'),
        year: fecha.getFullYear()
      };
    });

    // Batch insert
    // Drizzle insert many
    try {
        await this.db.insert(orfsTransactions).values(transactionsToInsert);
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

