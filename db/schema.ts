import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users Table
export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'trader', 'guest'] }).default('guest'),
  traderName: text('trader_name'),
  activo: integer('activo', { mode: 'boolean' }).default(true),
  rememberToken: text('remember_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Traders Table
export const traders = sqliteTable('traders', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  nit: text('nit'),
  porcentajeComision: real('porcentaje_comision').default(0.0000),
  activo: integer('activo', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// ORFS Transactions Table
export const orfsTransactions = sqliteTable('orfs_transactions', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  reasig: text('reasig'),
  nit: text('nit').notNull(),
  nombre: text('nombre').notNull(),
  corredor: text('corredor').notNull(),
  comiPorcentual: real('comi_porcentual').default(0.0000),
  ciudad: text('ciudad'),
  fecha: text('fecha').notNull(), // SQLite stores dates as text (ISO 8601)
  ruedaNo: integer('rueda_no').notNull(),
  negociado: real('negociado').default(0.00),
  comiBna: real('comi_bna').default(0.00),
  campo209: real('campo_209').default(0.00),
  comiCorr: real('comi_corr').default(0.00),
  ivaBna: real('iva_bna').default(0.00),
  ivaComi: real('iva_comi').default(0.00),
  ivaCama: real('iva_cama').default(0.00),
  facturado: real('facturado').default(0.00),
  mes: text('mes').notNull(),
  comiCorrNeto: real('comi_corr_neto').default(0.00),
  year: integer('year').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Presupuestos Table
export const presupuestos = sqliteTable('presupuestos', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  nit: text('nit').notNull(),
  corredor: text('corredor').notNull(),
  mes: integer('mes').notNull(),
  year: integer('year').notNull(),
  transadoPresupuesto: real('transado_presupuesto').default(0.00),
  comisionPresupuesto: real('comision_presupuesto').default(0.00),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
