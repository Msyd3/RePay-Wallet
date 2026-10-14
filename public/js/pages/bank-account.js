"use strict";
const bankSheet=document.getElementById('bank-sheet');
const bankForm=document.getElementById('bank-form');
const bankIban=document.getElementById('bank-iban');
const bankHolder=document.getElementById('bank-holder');
const bankSave=document.getElementById('bank-save');
const bankStatus=document.getElementById('bank-status');
let bankAccount=null,bankBusy=false,bankLoaded=false;
const bankCopy={ar:{add:'إضافة حساب بنكي',saved:'الحساب البنكي',iban:'الآيبان',name:'الاسم الكامل',placeholder:'الاسم كما هو مسجّل في البنك',save:'حفظ الحساب',edit:'تعديل',error:'تعذر تحميل الحساب البنكي. حاول مرة أخرى.',saveError:'تعذر حفظ الحساب. حاول مرة أخرى.',demo:'تم حفظ الحساب لهذه المعاينة فقط.',invalid:'تحقق من الآيبان والاسم الكامل.'},en:{add:'Add a bank account',saved:'Bank account',iban:'IBAN',name:'Full name',placeholder:'Name as registered with your bank',save:'Save account',edit:'Edit',error:'Unable to load your bank account. Please try again.',saveError:'Unable to save your account. Please try again.',demo:'Account saved for this preview only.',invalid:'Check your IBAN and full name.'}};
function bankText(){return bankCopy[document.documentElement.lang==='en'?'en':'ar'];}
function bankMessage(text){bankStatus.hidden=false;bankStatus.textContent=text;}
function bankUpdate(){bankSave.disabled=bankBusy || !bankLoaded || !RePayBanking.validIban(bankIban.value) || !RePayBanking.validHolder(bankHolder.value);}
function bankRender(edit=false){
 const t=bankText();document.getElementById('bank-title').textContent=bankAccount&&!edit?t.saved:t.add;
 document.querySelector('label[for="bank-iban"]').textContent=t.iban;document.querySelector('label[for="bank-holder"]').textContent=t.name;bankHolder.placeholder=t.placeholder;bankSave.textContent=t.save;document.getElementById('bank-edit').textContent=t.edit;
 document.getElementById('bank-saved').hidden=!bankAccount || edit;bankForm.hidden=!!bankAccount&&!edit;
 if(bankAccount){document.getElementById('bank-logo').src=RePayBanking.logo(bankAccount.bankLogoUrl);document.getElementById('saved-bank-name').textContent=bankAccount.bankName || t.saved;document.getElementById('saved-holder').textContent=bankAccount.accountHolder;document.getElementById('saved-iban').textContent=bankAccount.maskedIban || ('SA•• •••• •••• •••• •••• '+bankAccount.iban.slice(-4));}
 bankUpdate();
}
document.getElementById('withdraw-button').addEventListener('click',async()=>{
 if(bankBusy)return;bankStatus.hidden=true;bankLoaded=false;bankRender();bankSheet.showModal();bankBusy=true;bankUpdate();
 try {
  if(!window.REPAY_CONFIG.demo){const result=await window.REPAY_CONFIG.onLoadBankAccount();const candidate=result.account || null; if(candidate && (typeof candidate.accountHolder!=='string' || typeof candidate.maskedIban!=='string'))throw Error('Invalid account');bankAccount=candidate;}
  bankLoaded=true;
 }catch{bankMessage(bankText().error);}
 finally{bankBusy=false;bankRender();}
});
document.getElementById('bank-close').addEventListener('click',()=>bankSheet.close());
document.getElementById('bank-edit').addEventListener('click',()=>{if(bankBusy)return;bankIban.value='';bankHolder.value=bankAccount.accountHolder;bankRender(true);bankIban.focus();});
bankIban.addEventListener('input',()=>{const normalized=RePayBanking.normalize(bankIban.value).replace(/[^SA0-9]/g,'').slice(0,24);bankIban.value=normalized.replace(/(.{4})/g,'$1 ').trim();bankUpdate();});
bankHolder.addEventListener('input',bankUpdate);
bankForm.addEventListener('submit',async event=>{
 event.preventDefault();if(bankSave.disabled)return;
 const data={iban:RePayBanking.normalize(bankIban.value),accountHolder:bankHolder.value.trim()};
 if(!RePayBanking.validIban(data.iban)||!RePayBanking.validHolder(data.accountHolder)){bankMessage(bankText().invalid);return;}
 bankBusy=true;bankIban.readOnly=bankHolder.readOnly=true;bankUpdate();
 try{
  if(window.REPAY_CONFIG.demo){bankAccount={accountHolder:data.accountHolder,maskedIban:'SA•• •••• •••• •••• •••• '+data.iban.slice(-4)};bankMessage(bankText().demo);}
  else{const result=await window.REPAY_CONFIG.onSaveBankAccount(data);if(!result.account || typeof result.account.accountHolder!=='string' || typeof result.account.maskedIban!=='string')throw Error();bankAccount=result.account;bankStatus.hidden=true;}
  bankIban.value='';bankRender();
 }catch{bankMessage(bankText().saveError);}
 finally{bankBusy=false;bankIban.readOnly=bankHolder.readOnly=false;bankUpdate();}
});
