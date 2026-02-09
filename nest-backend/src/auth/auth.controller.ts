import { Controller, Request, Post, UseGuards, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() req) {
    const user = await this.authService.validateUser(req.username, req.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @Post('request-reset')
  async requestReset(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('El correo o usuario es requerido');
    }
    const result = await this.usersService.generateResetToken(body.email);
    if (!result) {
      // Return success even if user not found to prevent email enumeration
      return { message: 'Si el usuario existe, se ha generado un codigo de recuperacion.' };
    }
    // In production, send the token via email. For now, return it directly.
    return {
      message: 'Codigo de recuperacion generado exitosamente.',
      resetCode: result.token,
      userName: result.userName,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; token: string; newPassword: string }) {
    if (!body.email || !body.token || !body.newPassword) {
      throw new BadRequestException('Todos los campos son requeridos');
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException('La contrasena debe tener al menos 6 caracteres');
    }
    const success = await this.usersService.resetPassword(body.email, body.token, body.newPassword);
    if (!success) {
      throw new BadRequestException('Codigo invalido o expirado');
    }
    return { message: 'Contrasena actualizada exitosamente.' };
  }
}
