import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
async function files(dir) { const list = []; for (const entry of await readdir(dir, { withFileTypes: true })) { const path = `${dir}/${entry.name}`; if (entry.isDirectory()) list.push(...await files(path)); else list.push(path); } return list; }
const all = await files('public');
for (const file of all.filter(f => f.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!/innerHTML\s*=|document\.write\(|eval\(/.test(await readFile(file, 'utf8')), `Unsafe DOM/code sink: ${file}`);
}
for (const file of all.filter(f => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate ID in ${file}`);
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    if (/^https?:/.test(match[1])) continue;
    const path = resolve(dirname(file), match[1]);
    assert.ok(all.some(f => resolve(f) === path), `Missing local resource ${match[1]} in ${file}`);
  }
}
const config = await readFile('public/js/config.js', 'utf8');
assert.match(config, /demo: false/);
console.log(`Checked ${all.length} public files: syntax, resource links, IDs and unsafe sinks.`);
