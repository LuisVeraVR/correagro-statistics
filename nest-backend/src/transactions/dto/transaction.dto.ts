import { IsString, IsOptional, IsNumber, IsDateString, IsNumberString } from 'class-validator';

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  reasig?: string;

  @IsString()
  nit: string;

  @IsString()
  nombre: string;

  @IsString()
  corredor: string;

  @IsOptional()
  @IsNumberString()
  comiPorcentual?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsDateString()
  fecha: string; // YYYY-MM-DD

  @IsNumber()
  ruedaNo: number;

  @IsOptional()
  @IsNumberString()
  negociado?: string;

  @IsOptional()
  @IsNumberString()
  comiBna?: string;

  @IsOptional()
  @IsNumberString()
  campo209?: string;

  @IsOptional()
  @IsNumberString()
  comiCorr?: string;

  @IsOptional()
  @IsNumberString()
  ivaBna?: string;

  @IsOptional()
  @IsNumberString()
  ivaComi?: string;

  @IsOptional()
  @IsNumberString()
  ivaCama?: string;

  @IsOptional()
  @IsNumberString()
  facturado?: string;

  @IsString()
  mes: string;

  @IsOptional()
  @IsNumberString()
  comiCorrNeto?: string;

  @IsNumber()
  year: number;
}

export class UpdateTransactionDto {
    @IsOptional()
    @IsString()
    reasig?: string;
  
    @IsOptional()
    @IsString()
    nit?: string;
  
    @IsOptional()
    @IsString()
    nombre?: string;
  
    @IsOptional()
    @IsString()
    corredor?: string;
  
    @IsOptional()
    @IsNumberString()
    comiPorcentual?: string;
  
    @IsOptional()
    @IsString()
    ciudad?: string;
  
    @IsOptional()
    @IsDateString()
    fecha?: string;
  
    @IsOptional()
    @IsNumber()
    ruedaNo?: number;
  
    @IsOptional()
    @IsNumberString()
    negociado?: string;
  
    @IsOptional()
    @IsNumberString()
    comiBna?: string;
  
    @IsOptional()
    @IsNumberString()
    campo209?: string;
  
    @IsOptional()
    @IsNumberString()
    comiCorr?: string;
  
    @IsOptional()
    @IsNumberString()
    ivaBna?: string;
  
    @IsOptional()
    @IsNumberString()
    ivaComi?: string;
  
    @IsOptional()
    @IsNumberString()
    ivaCama?: string;
  
    @IsOptional()
    @IsNumberString()
    facturado?: string;
  
    @IsOptional()
    @IsString()
    mes?: string;
  
    @IsOptional()
    @IsNumberString()
    comiCorrNeto?: string;
  
    @IsOptional()
    @IsNumber()
    year?: number;
}
