import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const demo = process.argv.includes('--demo');
const output = resolve(demo ? 'dist-demo' : 'dist');
await mkdir(output, { recursive: true });
await cp('public', output, { recursive: true });
if (demo) {
  const config = await readFile('public/js/config.js', 'utf8');
  const fixture = await readFile('tests/fixtures/demo.json', 'utf8');
  await writeFile(`${output}/js/config.js`, config.replace('demo: false', 'demo: true') + `\nwindow.REPAY_CONFIG = Object.freeze({ ...window.REPAY_CONFIG, onPay: null, onCancel: null, onRequestOtp: null, onResendOtp: null, onVerifyOtp: null, onLogout: null, onSaveProfile: null });\nwindow.REPAY_DEMO = ${fixture};\n`);
}
console.log(`Built ${demo ? 'demo' : 'production'} frontend in ${output}`);
