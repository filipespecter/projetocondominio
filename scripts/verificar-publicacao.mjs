const origin = new URL(process.argv[2] ?? 'https://infinitycondo.tech');
if (origin.protocol !== 'https:') throw new Error('Use HTTPS para verificar a publicação/PWA.');
const checks = ['/', '/manifest.webmanifest', '/sw.js', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png', '/apple-touch-icon.png', '/api/health'];
let failures = 0;
for (const path of checks) {
  try {
    const response = await fetch(new URL(path,origin), {signal:AbortSignal.timeout(15000)});
    const type = response.headers.get('content-type') ?? '';
    let valid = response.ok;
    if (path.endsWith('.png')) valid &&= type.includes('image/png');
    if (path.endsWith('.js')) valid &&= /javascript/.test(type);
    if (path.endsWith('webmanifest')) {
      const manifest = await response.json();
      valid &&= manifest.display === 'standalone' && Array.isArray(manifest.icons) && manifest.icons.length >= 2;
    }
    if (path === '/api/health') valid &&= (await response.json()).status === 'ok';
    console.log(`${valid ? 'OK' : 'FALHA'} ${path}: ${response.status} ${type}`);
    if (!valid) failures++;
  } catch (error) { failures++;console.log(`FALHA ${path}: ${error.message}`); }
}
console.log('Este teste não valida login, conteúdo misto, instalação no dispositivo nem integrações externas.');
if (failures) process.exitCode = 1;
