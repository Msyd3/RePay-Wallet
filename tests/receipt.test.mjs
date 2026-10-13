import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source=await readFile('public/js/pages/success.js','utf8');
const core=await readFile('public/js/core.js','utf8');
async function verify(data,fail=false){
 const elements=Object.fromEntries(['return-button','result-message','success-icon','success-amount','success-value','result'].map(id=>[id,{hidden:true,textContent:'',setAttribute(){},removeAttribute(){this.hidden=false;}}]));const redirects=[];
 const c={window:{REPAY_CONFIG:{demo:false,transactionEndpoint:'/api/transactions/'}},location:{search:'?id=txn_1',origin:'https://repay.sa',href:'https://repay.sa/success.html',replace(url){redirects.push(url);}},URL,URLSearchParams,Intl,AbortSignal,sessionStorage:{removeItem(){}},document:{documentElement:{},getElementById:id=>elements[id],querySelector:()=>({alt:'',classList:{add(){}}})},fetch:async()=>{if(fail)throw Error();return {ok:true,json:async()=>data};}};
 vm.createContext(c);vm.runInContext(core,c);c.RePay=c.window.RePay;vm.runInContext(source,c);await new Promise(r=>setImmediate(r));return {elements,redirects};
}
test('Paid receipt displays server amount',async()=>{const c=await verify({id:'txn_1',status:'paid',currency:'SAR',amountMinor:4050});assert.equal(c.elements['success-icon'].hidden,false);assert.equal(c.elements['success-value'].textContent,'40.5');});
test('Unknown payment, mismatched ID, invalid amount and network errors never display success',async()=>{for(const [data,fail] of [[{id:'txn_1',status:'pending',currency:'SAR',amountMinor:4000},false],[{id:'other',status:'paid',currency:'SAR',amountMinor:4000},false],[{id:'txn_1',status:'paid',currency:'SAR',amountMinor:-1},false],[{},true]]){const c=await verify(data,fail);assert.equal(c.elements['success-icon'].hidden,true);assert.equal(c.elements['success-amount'].hidden,true);}});
test('Verified failed receipt redirects to failure page',async()=>{const c=await verify({id:'txn_1',status:'failed',currency:'SAR',amountMinor:4000});assert.match(c.redirects[0],/failure\.html/);});
