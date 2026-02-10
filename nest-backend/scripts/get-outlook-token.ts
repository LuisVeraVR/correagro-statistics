import { createServer } from 'http';
import { parse } from 'url';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const CLIENT_ID = process.env.MAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.MAIL_CLIENT_SECRET;
const PORT = 3002;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const TENANT_ID = '337b2ad6-6769-4542-8fde-3e1d4ddd6f6d'; // Tenant ID específico de Correagro

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Faltan MAIL_CLIENT_ID o MAIL_CLIENT_SECRET en el archivo .env');
  console.log('Por favor asegúrate de haber registrado tu App en Azure Portal y copiado las credenciales.');
  process.exit(1);
}

const SCOPES = ['https://outlook.office.com/SMTP.Send', 'offline_access'];

const server = createServer(async (req, res) => {
  const { query, pathname } = parse(req.url || '', true);

  if (pathname === '/callback') {
    const code = query.code as string;

    if (code) {
      console.log('Código recibido. Obteniendo tokens...');
      try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('scope', SCOPES.join(' '));
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('grant_type', 'authorization_code');
        params.append('client_secret', CLIENT_SECRET);

        const tokenResponse = await axios.post(
          `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
          params,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        const refreshToken = tokenResponse.data.refresh_token;

        if (!refreshToken) {
            throw new Error('No se recibió refresh_token en la respuesta.');
        }

        // Actualizar .env
        const envPath = path.resolve(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('MAIL_REFRESH_TOKEN=')) {
            // Reemplazar existente
            const regex = /MAIL_REFRESH_TOKEN=.*/;
            envContent = envContent.replace(regex, `MAIL_REFRESH_TOKEN=${refreshToken}`);
        } else {
            // Agregar al final
            envContent += `\nMAIL_REFRESH_TOKEN=${refreshToken}`;
        }
        
        fs.writeFileSync(envPath, envContent);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: green;">¡Autenticación Exitosa!</h1>
                    <p>El Refresh Token ha sido guardado automáticamente en tu archivo <strong>.env</strong>.</p>
                    <p>Ya puedes cerrar esta ventana y reiniciar tu servidor NestJS.</p>
                </body>
            </html>
        `);
        console.log('\x1b[32m%s\x1b[0m', '\n¡Éxito! Refresh Token obtenido y guardado en .env');
        console.log('Ahora reinicia tu servidor backend para aplicar los cambios.');
        
        server.close();
        setTimeout(() => process.exit(0), 1000);
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>Error</h1><p>${error.response?.data?.error_description || error.message}</p>`);
        console.error('\x1b[31m%s\x1b[0m', 'Error obteniendo token:', error.response?.data || error.message);
        
        server.close();
        process.exit(1);
      }
    }
  }
});

server.listen(PORT, () => {
  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&response_mode=query&scope=${encodeURIComponent(SCOPES.join(' '))}&state=12345`;
  
  console.log('\n================================================================');
  console.log(' AUTENTICACIÓN OAUTH2 PARA OUTLOOK');
  console.log('================================================================');
  console.log(`1. Asegúrate de que http://localhost:${PORT}/callback esté agregado`);
  console.log('   como "Redirect URI" (Web) en tu App Registration de Azure.');
  console.log('2. Abre el siguiente enlace en tu navegador para autorizar:');
  console.log('\n\x1b[36m%s\x1b[0m\n', authUrl);
  console.log('Esperando autorización...');
});
