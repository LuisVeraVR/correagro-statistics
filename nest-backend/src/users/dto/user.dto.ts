import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(['admin', 'trader', 'business_intelligence', 'guest'])
  role: 'admin' | 'trader' | 'business_intelligence' | 'guest';

  @IsOptional()
  @IsString()
  traderName?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(['admin', 'trader', 'business_intelligence', 'guest'])
  role?: 'admin' | 'trader' | 'business_intelligence' | 'guest';

  @IsOptional()
  @IsString()
  traderName?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
