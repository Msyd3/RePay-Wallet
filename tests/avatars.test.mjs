import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
const source=await readFile('public/js/avatars.js','utf8');
function runtime(){const store=new Map();const c={window:{REPAY_CONFIG:{demo:false}},URL,Uint32Array,crypto:webcrypto,location:{origin:'https://repay.sa'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};vm.createContext(c);vm.runInContext(source,c);return c.window.RePayAvatars;}
test('Default avatar stays stable per user across repeated renders',()=>{const r=runtime();const first=r.source({id:'user_1'});assert.equal(r.source({id:'user_1'}),first);assert.ok(r.presets.some(p=>p.src===first));assert.equal(r.presets.length,11);});
test('Only preset IDs and same-origin avatar service URLs are accepted',()=>{const r=runtime();assert.equal(r.source({avatarId:'05-man-saudi'}),'assets/avatars/05-man-saudi.jpg');for(const url of ['javascript:alert(1)','https://evil.example/api/avatars/a','data:image/svg+xml,test','/other/a'])assert.equal(r.safeUrl(url),null);assert.equal(r.safeUrl('/api/avatars/abc'),'https://repay.sa/api/avatars/abc');});
test('Album rejects unsupported formats and oversized input before decoding',async()=>{const r=runtime();await assert.rejects(r.album({type:'image/svg+xml',size:100}));await assert.rejects(r.album({type:'image/jpeg',size:6*1024*1024}));});
