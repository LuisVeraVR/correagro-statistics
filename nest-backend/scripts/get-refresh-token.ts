import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { URL } from 'url';

// Función simple para leer .env
function getEnvValue(key: string): string {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts[0].trim() === key) {
        return parts.slice(1).join('=').trim();
      }
    }
  } catch (error) {
    console.error('Error leyendo .env:', error);
  }
  return '';
}

async function main() {
  const clientId = getEnvValue('MAIL_CLIENT_ID');
  const clientSecret = getEnvValue('MAIL_CLIENT_SECRET');
  const tenantId = getEnvValue('MAIL_TENANT_ID');
  const port = 3002;
  const redirectUri = `http://localhost:${port}/callback`;

  if (!clientId || !clientSecret || !tenantId) {
    console.error('❌ Error: Faltan credenciales en el archivo .env');
    console.error('Asegúrate de llenar MAIL_CLIENT_ID, MAIL_CLIENT_SECRET y MAIL_TENANT_ID antes de ejecutar este script.');
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || '', `http://localhost:${port}`);
    
    if (reqUrl.pathname === '/callback') {
      const code = reqUrl.searchParams.get('code');
      
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Autenticacion exitosa!</h1><p>Puedes cerrar esta ventana y volver a la terminal.</p>');
        
        console.log('✅ Código de autorización recibido.');
        console.log('🔄 Intercambiando código por tokens...');

        try {
          const params = new URLSearchParams();
          params.append('client_id', clientId);
          params.append('client_secret', clientSecret);
          params.append('code', code);
          params.append('redirect_uri', redirectUri);
          params.append('grant_type', 'authorization_code');

          const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );

          const refreshToken = tokenResponse.data.refresh_token;

          if (!refreshToken) {
            console.error('\n⚠️  Advertencia: No se recibió un Refresh Token.');
            console.error('Respuesta completa de Microsoft:', JSON.stringify(tokenResponse.data, null, 2));
            console.error('Posible causa: El permiso "offline_access" no fue aceptado o solicitado correctamente.');
          } else {
            console.log('\n✨ ¡ÉXITO! Aquí está tu Refresh Token:\n');
            console.log('---------------------------------------------------');
            console.log(refreshToken);
            console.log('---------------------------------------------------');
            console.log('\n👉 Copia este valor y pégalo en tu archivo .env en el campo MAIL_REFRESH_TOKEN');
          }
          
        } catch (error: any) {
          console.error('❌ Error obteniendo el token:', error.response?.data || error.message);
        } finally {
          server.close();
          process.exit(0);
        }
      } else {
        res.writeHead(400);
        res.end('No code found');
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    // Usamos encodeURIComponent para asegurar que los espacios y caracteres especiales se manejen bien
    const scopes = encodeURIComponent('https://outlook.office.com/SMTP.Send offline_access');
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scopes}`;
    
    console.log(`\n🚀 Servidor de autenticación iniciado en puerto ${port}`);
    console.log('\n👉 Por favor, abre este enlace en tu navegador para iniciar sesión:\n');
    console.log(authUrl);
    console.log('\nEsperando autenticación...');
  });
}

main();
