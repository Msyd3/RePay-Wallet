import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
const demo = process.argv.includes('--demo');
const output = resolve(demo ? 'dist-demo' : 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp('public', output, { recursive: true });
if (demo) {
  const config = await readFile('public/js/config.js', 'utf8');
  const fixture = await readFile('tests/fixtures/demo.json', 'utf8');
  await writeFile(`${output}/js/config.js`, config.replace('demo: false', 'demo: true') + `\nwindow.REPAY_CONFIG = Object.freeze({ ...window.REPAY_CONFIG, onPay: null, onCancel: null, onRequestOtp: null, onResendOtp: null, onVerifyOtp: null, onLogout: null, onSaveProfile: null, onLoadBankAccount: null, onSaveBankAccount: null, onDeleteBankAccount: null });\nwindow.REPAY_DEMO = ${fixture};\n`);
}
for (const name of await readdir(output)) {
  if (!name.endsWith('.html')) continue;
  let html = await readFile(`${output}/${name}`, 'utf8');
  for (const match of html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)"/g)) {
    const hash = createHash('sha256').update(await readFile(`${output}/${match[1]}`)).digest('hex').slice(0,12);
    html = html.replaceAll(`"${match[1]}"`, `"${match[1]}?v=${hash}"`);
  }
  await writeFile(`${output}/${name}`, html);
}
const cleanRoutes = [
  ['summary', 'index.html'], ['login', 'login.html'], ['otp', 'otp.html'],
  ['home', 'home.html'], ['profile', 'profile.html'], ['success', 'success.html'], ['failure', 'failure.html']
];
for (const [route, page] of cleanRoutes) {
  const routeDir = resolve(output, route);
  await mkdir(routeDir, { recursive: true });
  await cp(resolve(output, page), resolve(routeDir, 'index.html'));
}
console.log(`Built ${demo ? 'demo' : 'production'} frontend in ${output}`);
