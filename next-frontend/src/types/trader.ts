export interface Trader {
  id: number;
  nombre: string;
  nit?: string;
  porcentajeComision?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTraderDto {
  nombre: string;
  nit?: string;
  porcentajeComision?: string;
  activo?: boolean;
}

export type UpdateTraderDto = Partial<CreateTraderDto>;
