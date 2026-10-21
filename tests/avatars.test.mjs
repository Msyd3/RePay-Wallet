import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source=await readFile('public/js/avatars.js','utf8');
function runtime(){const c={window:{REPAY_CONFIG:{demo:false}}};vm.createContext(c);vm.runInContext(source,c);return c.window.RePayAvatars;}
test('Initial derives from Arabic and English user names',()=>{const r=runtime();assert.equal(r.initial({fullName:' محمد أحمد'}),'M');assert.equal(r.initial({displayName:'mohammed'}),'M');assert.equal(r.initial({name:'علي'}),'A');});
test('Avatar only accepts whitelisted emoji and color values',()=>{const r=runtime();assert.equal(r.normalize({kind:'emoji',emoji:'⚽',color:'pink'}).kind,'emoji');assert.equal(r.normalize({kind:'emoji',emoji:'<img>',color:'url(evil)'}).kind,'initial');assert.equal(r.normalize({color:'url(evil)'}).color,'blue');});
test('Default color is stable per user; old photo URL is ignored',()=>{const r=runtime();assert.equal(r.selection({id:'user1'}).color,r.selection({id:'user1'}).color);assert.equal(r.selection({avatarUrl:'https://evil.example/photo'}).kind,'initial');});
