import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log('--- Iniciando prueba de envío de correo SMTP (Aislado) ---');
  
  const user = process.env.MAIL_USER;
  const clientId = process.env.MAIL_CLIENT_ID;
  const clientSecret = process.env.MAIL_CLIENT_SECRET;
  const refreshToken = process.env.MAIL_REFRESH_TOKEN;
  const tenantId = process.env.MAIL_TENANT_ID;

  console.log(`Usuario: ${user}`);
  console.log(`Client ID: ${clientId ? clientId.substring(0, 5) + '...' : 'FALTANTE'}`);
  console.log(`Client Secret: ${clientSecret ? clientSecret.substring(0, 5) + '...' : 'FALTANTE'}`);
  console.log(`Refresh Token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'FALTANTE'}`);
  console.log(`Tenant ID: ${tenantId}`);

  if (!user || !clientId || !clientSecret || !refreshToken || !tenantId) {
    console.error('❌ Faltan variables de entorno. Revisa tu archivo .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    auth: {
      type: 'OAuth2',
      user: user,
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      // URL específica para renovar token en Azure AD v2
      accessUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, 
    },
    debug: true, // Habilitar debug detallado
    logger: true // Loguear a consola
  });

  const mailOptions = {
    from: user,
    to: user, // Enviarse a sí mismo para probar
    subject: 'Prueba de Correo SMTP - Correagro',
    text: 'Si lees esto, la configuración SMTP OAuth2 es CORRECTA.',
  };

  try {
    console.log('Intentando enviar correo...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente!');
    console.log('Message ID:', info.messageId);
  } catch (error: any) {
    console.error('❌ Error al enviar correo:', error.message);
    if (error.response) {
      console.error('Detalles del servidor:', error.response);
    }
  }
}

main();
