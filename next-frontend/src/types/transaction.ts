export interface Transaction {
  id: number;
  reasig?: string;
  nit: string;
  nombre: string;
  corredor: string;
  comiPorcentual?: string;
  ciudad?: string;
  fecha: string;
  ruedaNo: number;
  negociado?: string;
  comiBna?: string;
  campo209?: string;
  comiCorr?: string;
  ivaBna?: string;
  ivaComi?: string;
  ivaCama?: string;
  facturado?: string;
  mes: string;
  comiCorrNeto?: string;
  year: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionDto {
  reasig?: string;
  nit: string;
  nombre: string;
  corredor: string;
  comiPorcentual?: string;
  ciudad?: string;
  fecha: string;
  ruedaNo: number;
  negociado?: string;
  comiBna?: string;
  campo209?: string;
  comiCorr?: string;
  ivaBna?: string;
  ivaComi?: string;
  ivaCama?: string;
  facturado?: string;
  mes: string;
  comiCorrNeto?: string;
  year: number;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}
