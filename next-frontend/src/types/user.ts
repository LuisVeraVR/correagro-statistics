export type UserRole = 'admin' | 'trader' | 'business_intelligence' | 'guest';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  traderName?: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  traderName?: string;
  activo?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  traderName?: string;
  activo?: boolean;
}
