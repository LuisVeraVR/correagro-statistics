import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private async initTransporter() {
    const envVars = {
      MAIL_HOST: this.configService.get<string>('MAIL_HOST'),
      MAIL_PORT: this.configService.get<number>('MAIL_PORT'),
      MAIL_SECURE: this.configService.get<string>('MAIL_SECURE'),
      MAIL_USER: this.configService.get<string>('MAIL_USER'),
      MAIL_CLIENT_ID: this.configService.get<string>('MAIL_CLIENT_ID'),
      MAIL_CLIENT_SECRET: this.configService.get<string>('MAIL_CLIENT_SECRET'),
      MAIL_REFRESH_TOKEN: this.configService.get<string>('MAIL_REFRESH_TOKEN'),
      MAIL_TENANT_ID: this.configService.get<string>('MAIL_TENANT_ID'),
      MAIL_AUTH_TYPE: this.configService.get<string>('MAIL_AUTH_TYPE'),
      MAIL_FROM: this.configService.get<string>('MAIL_FROM'),
    };

    this.logger.log('========== MAIL CONFIG DEBUG ==========');
    this.logger.log(`MAIL_HOST: ${envVars.MAIL_HOST ?? 'UNDEFINED'}`);
    this.logger.log(`MAIL_PORT: ${envVars.MAIL_PORT ?? 'UNDEFINED'}`);
    this.logger.log(`MAIL_SECURE: ${envVars.MAIL_SECURE ?? 'UNDEFINED'}`);
    this.logger.log(`MAIL_USER: ${envVars.MAIL_USER ?? 'UNDEFINED'}`);
    this.logger.log(`MAIL_CLIENT_ID: ${envVars.MAIL_CLIENT_ID ? envVars.MAIL_CLIENT_ID.substring(0, 8) + '...' : 'UNDEFINED'}`);
    this.logger.log(`MAIL_CLIENT_SECRET: ${envVars.MAIL_CLIENT_SECRET ? envVars.MAIL_CLIENT_SECRET.substring(0, 5) + '...' : 'UNDEFINED'}`);
    this.logger.log(`MAIL_REFRESH_TOKEN: ${envVars.MAIL_REFRESH_TOKEN ? envVars.MAIL_REFRESH_TOKEN.substring(0, 10) + '...' : 'UNDEFINED'}`);
    this.logger.log(`MAIL_TENANT_ID: ${envVars.MAIL_TENANT_ID ?? 'UNDEFINED'}`);
    this.logger.log(`MAIL_AUTH_TYPE: ${envVars.MAIL_AUTH_TYPE ?? 'UNDEFINED'}`);
    this.logger.log(`MAIL_FROM: ${envVars.MAIL_FROM ?? 'UNDEFINED'}`);
    this.logger.log('========================================');

    // Verificar variables críticas
    if (!envVars.MAIL_CLIENT_ID || !envVars.MAIL_TENANT_ID) {
      this.logger.error('❌ CRITICAL: OAuth2 credentials not loaded! Check .env file location and ConfigModule setup.');
    }

    const isSecure = envVars.MAIL_SECURE === 'true';
    const mailConfig: any = {
      host: envVars.MAIL_HOST,
      port: envVars.MAIL_PORT,
      secure: isSecure,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
      debug: true,
      logger: true,
    };

    const authType = envVars.MAIL_AUTH_TYPE;

    if (authType === 'OAuth2') {
      mailConfig.auth = {
        type: 'OAuth2',
        user: envVars.MAIL_USER,
        clientId: envVars.MAIL_CLIENT_ID,
        clientSecret: envVars.MAIL_CLIENT_SECRET,
        refreshToken: envVars.MAIL_REFRESH_TOKEN,
        accessUrl: `https://login.microsoftonline.com/${envVars.MAIL_TENANT_ID}/oauth2/v2.0/token`,
      };
      this.logger.log('✅ Configuring MailService with OAuth2');
      this.logger.log(`Access URL: https://login.microsoftonline.com/${envVars.MAIL_TENANT_ID}/oauth2/v2.0/token`);
    } else {
      mailConfig.auth = {
        user: envVars.MAIL_USER,
        pass: this.configService.get<string>('MAIL_PASS'),
      };
      this.logger.log('Configuring MailService with Basic Auth');
    }

    this.transporter = nodemailer.createTransport(mailConfig);
  }

  async sendPasswordResetEmail(to: string, token: string, userName: string) {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: to,
      subject: 'Recuperación de Contraseña - Correagro',
      html: `
        <h3>Hola ${userName},</h3>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Tu código de recuperación es:</p>
        <h2>${token}</h2>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <br>
        <p>Saludos,</p>
        <p>El equipo de Correagro</p>
      `,
    };

    try {
      this.logger.log(`Attempting to send email to ${to} using configured transporter...`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('❌ Error sending email', error);
      throw error;
    }
  }
}