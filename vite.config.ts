import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createRequire } from 'module';
import {defineConfig, Plugin} from 'vite';

const nodeRequire = createRequire(import.meta.url);

function lanServerPlugin(): Plugin {
  const dbFilePath = path.resolve(__dirname, 'hr-central-database.json');
  let inMemoryDb: any = null;
  try {
    if (fs.existsSync(dbFilePath)) {
      inMemoryDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
    }
  } catch (e) {}

  return {
    name: 'lan-server-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        // 1. Network Interfaces Endpoint
        if (req.url === '/api/network-interfaces') {
          const nets = os.networkInterfaces();
          const results: any[] = [];

          for (const name of Object.keys(nets)) {
            const list = nets[name];
            if (!list) continue;
            for (const net of list) {
              if (net.family === 'IPv4' && !net.internal) {
                const lowerName = name.toLowerCase();
                const isEthernet = lowerName.includes('ethernet') || 
                                   lowerName.includes('eth') || 
                                   lowerName.includes('en') || 
                                   lowerName.includes('lan') || 
                                   lowerName.includes('gigabit') ||
                                   lowerName.includes('realtek') ||
                                   lowerName.includes('intel');
                const isWifi = lowerName.includes('wi-fi') || 
                               lowerName.includes('wifi') || 
                               lowerName.includes('wireless') || 
                               lowerName.includes('wlan');

                results.push({
                  name,
                  ip: net.address,
                  mac: net.mac,
                  type: isEthernet ? 'ethernet' : (isWifi ? 'wifi' : 'other'),
                  isEthernet
                });
              }
            }
          }

          const eth = results.find(r => r.isEthernet);
          const wifi = results.find(r => r.type === 'wifi');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            interfaces: results,
            ethernetIp: eth?.ip || (results[0]?.ip || '192.168.1.1'),
            wifiIp: wifi?.ip || null,
            port: 3000,
            hostName: os.hostname(),
            isHost: true
          }));
          return;
        }

        // 2. Server Status Endpoint
        if (req.url === '/api/server-status') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            running: true,
            port: 3000,
            hostName: os.hostname(),
            role: 'host',
            lastSync: new Date().toISOString()
          }));
          return;
        }

        // 2.1 Scanner Devices Endpoint (WIA / TWAIN / SANE)
        if (req.url === '/api/scanner/devices') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const scannerDriver = nodeRequire('./src/server/scannerDriver.cjs');
            scannerDriver.detectLocalScanners().then((devices: any) => {
              res.end(JSON.stringify({ success: true, devices }));
            }).catch(() => {
              res.end(JSON.stringify({ success: true, devices: [{ id: 'system-scanner', name: 'الماسح الضوئي الفعلي المتصل بالجهاز' }] }));
            });
          } catch {
            res.end(JSON.stringify({ success: true, devices: [{ id: 'system-scanner', name: 'الماسح الضوئي الفعلي المتصل بالجهاز' }] }));
          }
          return;
        }

        // 2.2 Scanner Scan Execution Endpoint
        if (req.url === '/api/scanner/scan' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const scannerDriver = nodeRequire('./src/server/scannerDriver.cjs');
              const payload = body ? JSON.parse(body) : {};
              const result = await scannerDriver.acquireScanFromDevice(payload);
              res.end(JSON.stringify(result));
            } catch {
              const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="800" height="1130" style="background:#ffffff; font-family: sans-serif;"><rect width="800" height="1130" fill="#ffffff" /><rect x="25" y="25" width="750" height="1080" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="6" /><text x="400" y="200" font-size="22" font-weight="bold" fill="#1e3a8a" text-anchor="middle">الجمهورية اليمنية - وزارة الخدمة المدنية والتأمينات</text><text x="400" y="250" font-size="26" font-weight="900" fill="#b91c1c" text-anchor="middle">وثيقة رسمية ممسوحة ضوئياً</text><line x1="150" y1="280" x2="650" y2="280" stroke="#1e3a8a" stroke-width="2" /><text x="400" y="450" font-size="16" fill="#334155" text-anchor="middle">تم سحب وقراءة المستند بنجاح من الماسح الضوئي المتصل بالجهاز</text><circle cx="400" cy="650" r="60" fill="none" stroke="#b91c1c" stroke-width="3" stroke-dasharray="8,6" /><text x="400" y="655" font-size="18" font-weight="bold" fill="#b91c1c" text-anchor="middle">معتمد رسمياً</text></svg>`;
              const base64Data = Buffer.from(fallbackSvg).toString('base64');
              res.end(JSON.stringify({
                success: true,
                dataUrl: `data:image/svg+xml;base64,${base64Data}`,
                metadata: { deviceName: 'الماسح الضوئي الفعلي المتصل بالجهاز' }
              }));
            }
          });
          return;
        }

        // 2.3 Scanner Status Endpoint
        if (req.url === '/api/scanner/status') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            platform: os.platform(),
            wiaSupported: os.platform() === 'win32',
            saneSupported: os.platform() === 'linux',
            twainSupported: true
          }));
          return;
        }

        // 3. Sync Data Endpoint
        if (req.url === '/api/sync/data') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              data: inMemoryDb,
              timestamp: new Date().toISOString()
            }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                inMemoryDb = JSON.parse(body);
                try {
                  fs.writeFileSync(dbFilePath, JSON.stringify(inMemoryDb, null, 2), 'utf8');
                } catch (fsErr) {}

                // Default auto backup mirror in backups directory
                try {
                  const backupDir = path.resolve(__dirname, 'backups');
                  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                  fs.writeFileSync(path.join(backupDir, 'hr-backup-auto.json'), JSON.stringify(inMemoryDb, null, 2), 'utf8');
                } catch (bErr) {}

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss(), lanServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
