import { IsString, IsOptional, IsBoolean, IsNumberString } from 'class-validator';

export class CreateTraderDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsNumberString()
  porcentajeComision?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateTraderDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsNumberString()
  porcentajeComision?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
