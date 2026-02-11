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
    const isSecure = this.configService.get<string>('MAIL_SECURE') === 'true';
    const mailConfig: any = {
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: isSecure,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
      debug: true, // Mantener debug para ver respuesta del servidor SMTP si falla
      logger: true,
    };

    const authType = this.configService.get<string>('MAIL_AUTH_TYPE');

    if (authType === 'OAuth2') {
      mailConfig.auth = {
        type: 'OAuth2',
        user: this.configService.get<string>('MAIL_USER'),
        clientId: this.configService.get<string>('MAIL_CLIENT_ID'),
        clientSecret: this.configService.get<string>('MAIL_CLIENT_SECRET'),
        refreshToken: this.configService.get<string>('MAIL_REFRESH_TOKEN'),
        accessUrl: `https://login.microsoftonline.com/${this.configService.get<string>('MAIL_TENANT_ID')}/oauth2/v2.0/token`,
      };
      this.logger.log('Configuring MailService with OAuth2');
    } else {
      mailConfig.auth = {
        user: this.configService.get<string>('MAIL_USER'),
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