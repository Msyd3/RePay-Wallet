import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile('public/js/pages/login.js','utf8');
function runtime(handler) {
 const handlers={},stored=new Map(),navigation=[];
 const input={value:'',setCustomValidity(){},reportValidity(){},addEventListener(n,fn){handlers.input=fn;}};
 const button={disabled:false},status={hidden:true};
 const context={window:{REPAY_CONFIG:{demo:false,onRequestOtp:handler},dispatchEvent(){}},document:{getElementById(id){return {'login-phone':input,'login-next':button,'login-status':status,'login-form':{addEventListener(n,fn){handlers.submit=fn;}}}[id];}},sessionStorage:{setItem(k,v){stored.set(k,v);},removeItem(k){stored.delete(k);}},location:{assign(v){navigation.push(v);}},CustomEvent:class{},Date};
 vm.createContext(context);vm.runInContext(source,context);return {handlers,stored,navigation,input,button};
}
test('Next is disabled until valid phone entered; Arabic digits normalize',()=>{const c=runtime();assert.equal(c.button.disabled,true);c.input.value='٠٥١٢٣٤٥٦٧٨';c.handlers.input();assert.equal(c.input.value,'0512345678');assert.equal(c.button.disabled,false);c.input.value='0412345678';c.handlers.input();assert.equal(c.button.disabled,true);});
test('Unconfirmed challenge never navigates',async()=>{const c=runtime(async()=>({status:'sent'}));c.input.value='0512345678';c.handlers.input();await c.handlers.submit({preventDefault(){}});assert.equal(c.navigation.length,0);assert.equal(c.stored.size,0);});
test('Confirmed request stores opaque challenge, not phone or OTP',async()=>{let request;const c=runtime(async data=>{request=data;return {status:'sent',challengeId:'challenge_1'};});c.input.value='0512345678';c.handlers.input();await c.handlers.submit({preventDefault(){}});assert.equal(request.phone,'+966512345678');assert.equal(c.navigation[0],'otp.html');assert.equal(c.stored.get('repay-otp-challenge'),'challenge_1');assert.equal([...c.stored.values()].some(v=>v.includes('0512345678')),false);});
