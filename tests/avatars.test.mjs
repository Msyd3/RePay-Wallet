import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const source=await readFile('public/js/avatars.js','utf8');
function runtime(storage=new Map()){
 const c={window:{},crypto:webcrypto,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
 vm.createContext(c);vm.runInContext(source,c);return c.window.RePayAvatars;
}
test('Exactly ten fixed avatars; external paths and legacy options are rejected',()=>{
 const r=runtime();assert.equal(r.ids.length,10);assert.equal(new Set(r.ids).size,10);
 assert.equal(r.normalize({id:'https://evil.example/avatar.png'}).id,'remoji-01');
 assert.equal(r.normalize({kind:'emoji',emoji:'⚽'}).id,'remoji-01');
});
test('Random assignment stays stable across page loads for each user',()=>{
 const storage=new Map();const r=runtime(storage);const user={id:'user-1'};
 const choice=r.selection(user);assert.ok(r.ids.includes(choice.id));
 assert.equal(r.selection(user).id,choice.id);assert.equal(runtime(storage).selection(user).id,choice.id);
 r.save({id:'user-2'},{id:'remoji-10'});assert.equal(r.selection(user).id,choice.id);
});
test('User choice persists; server approved avatar takes precedence',()=>{
 const storage=new Map();const r=runtime(storage);r.save({id:'user-1'},{id:'remoji-07'});
 assert.equal(runtime(storage).selection({id:'user-1'}).id,'remoji-07');
 assert.equal(r.selection({id:'user-1',avatar:{id:'remoji-03'}}).id,'remoji-03');
});
