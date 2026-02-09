import { mysqlTable, serial, varchar, timestamp, mysqlEnum, boolean, decimal, int, date, bigint } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp('email_verified_at'),
  password: varchar('password', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'trader', 'business_intelligence', 'guest']).default('guest'),
  traderName: varchar('trader_name', { length: 255 }),
  activo: boolean('activo').default(true),
  rememberToken: varchar('remember_token', { length: 100 }),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const traders = mysqlTable('traders', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull().unique(),
  nit: varchar('nit', { length: 20 }),
  porcentajeComision: decimal('porcentaje_comision', { precision: 10, scale: 4 }).default('0.0000'),
  activo: boolean('activo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const traderAdicionales = mysqlTable('trader_adicionales', {
  id: serial('id').primaryKey(),
  traderId: bigint('trader_id', { mode: 'number', unsigned: true }).notNull(),
  nombreAdicional: varchar('nombre_adicional', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const orfsTransactions = mysqlTable('orfs_transactions', {
  id: serial('id').primaryKey(),
  reasig: varchar('reasig', { length: 100 }),
  nit: varchar('nit', { length: 20 }).notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  corredor: varchar('corredor', { length: 255 }).notNull(),
  comiPorcentual: decimal('comi_porcentual', { precision: 10, scale: 4 }).default('0.0000'),
  ciudad: varchar('ciudad', { length: 100 }),
  fecha: date('fecha').notNull(),
  ruedaNo: int('rueda_no').notNull(),
  negociado: decimal('negociado', { precision: 15, scale: 2 }).default('0.00'),
  comiBna: decimal('comi_bna', { precision: 15, scale: 2 }).default('0.00'),
  campo209: decimal('campo_209', { precision: 15, scale: 2 }).default('0.00'),
  comiCorr: decimal('comi_corr', { precision: 15, scale: 2 }).default('0.00'),
  ivaBna: decimal('iva_bna', { precision: 15, scale: 2 }).default('0.00'),
  ivaComi: decimal('iva_comi', { precision: 15, scale: 2 }).default('0.00'),
  ivaCama: decimal('iva_cama', { precision: 15, scale: 2 }).default('0.00'),
  facturado: decimal('facturado', { precision: 15, scale: 2 }).default('0.00'),
  mes: varchar('mes', { length: 20 }).notNull(),
  comiCorrNeto: decimal('comi_corr_neto', { precision: 15, scale: 2 }).default('0.00'),
  year: int('year').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const bmcReportes = mysqlTable('bmc_reportes', {
  id: serial('id').primaryKey(),
  periodo: varchar('periodo', { length: 100 }),
  fechaCarga: timestamp('fecha_carga').defaultNow(),
});

export const bmcProductosSector = mysqlTable('bmc_productos_sector', {
  id: serial('id').primaryKey(),
  reporteId: bigint('reporte_id', { mode: 'number', unsigned: true }).notNull(),
  producto: varchar('producto', { length: 255 }),
  sector: varchar('sector', { length: 255 }),
  montoMillones: decimal('monto_millones', { precision: 15, scale: 2 }).default('0.00'),
  participacionPct: decimal('participacion_pct', { precision: 10, scale: 4 }).default('0.0000'),
  variacionPct: decimal('variacion_pct', { precision: 10, scale: 4 }).default('0.0000'),
});
