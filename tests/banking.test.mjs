import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile('public/js/banking.js','utf8');
const c={window:{},URL,location:{origin:'https://repay.sa'},RePay:{digits:v=>String(v).replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x0660))}};vm.createContext(c);vm.runInContext(source,c);const r=c.window.RePayBanking;
function iban(){const body='80000000608010167519';let rem=0;for(const d of body+'281000')rem=(rem*10+Number(d))%97;return 'SA'+String(98-rem).padStart(2,'0')+body;}
test('Saudi IBAN validates checksum, length and country',()=>{const value=iban();assert.equal(r.validIban(value),true);assert.equal(r.validIban(value.replace(/(.{4})/g,'$1 ')),true);assert.equal(r.validIban(value.slice(0,-1)+'8'),false);assert.equal(r.validIban('AE'+value.slice(2)),false);assert.equal(r.validIban('SA123'),false);});
test('Holder requires full name; logos cannot point to external URLs',()=>{assert.equal(r.validHolder('محمد أحمد'),true);assert.equal(r.validHolder('محمد'),false);assert.equal(r.logo('https://external.example/logo.svg'),'assets/bank.svg');assert.equal(r.logo('/api/bank-logos/example'),'https://repay.sa/api/bank-logos/example');});
