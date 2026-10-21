"use strict";
const bankSheet=document.getElementById('bank-sheet');
const bankForm=document.getElementById('bank-form');
const bankIban=document.getElementById('bank-iban');
const bankHolder=document.getElementById('bank-holder');
const bankSave=document.getElementById('bank-save');
const bankStatus=document.getElementById('bank-status');
let bankAccounts=[],bankBusy=false,bankLoaded=false,bankEditing=null,bankShowForm=false;
const bankCopy={ar:{add:'إضافة حساب بنكي',saved:'الحسابات البنكية',iban:'الآيبان',name:'الاسم الكامل',placeholder:'الاسم كما هو مسجّل في البنك',save:'حفظ الحساب',edit:'تعديل',remove:'حذف',addMore:'+ إضافة حساب إضافي',back:'رجوع',paste:'لصق',last:'أضف حسابًا ثانيًا قبل حذف هذا الحساب.',error:'تعذر تحميل الحسابات البنكية. حاول مرة أخرى.',saveError:'تعذر حفظ الحساب. حاول مرة أخرى.',demo:'تم حفظ الحساب لهذه المعاينة فقط.',invalid:'تحقق من الآيبان والاسم الكامل.',pasteError:'لم نتمكن من قراءة الحافظة. الصق الآيبان داخل الخانة.',deleteError:'تعذر حذف الحساب. حاول مرة أخرى.',duplicate:'هذا الحساب مضاف مسبقًا.'},en:{add:'Add a bank account',saved:'Bank accounts',iban:'IBAN',name:'Full name',placeholder:'Name as registered with your bank',save:'Save account',edit:'Edit',remove:'Delete',addMore:'+ Add another account',back:'Back',paste:'Paste',last:'Add another account before deleting this one.',error:'Unable to load bank accounts. Please try again.',saveError:'Unable to save your account. Please try again.',demo:'Account saved for this preview only.',invalid:'Check your IBAN and full name.',pasteError:'Unable to read clipboard. Paste the IBAN into the field.',deleteError:'Unable to delete this account. Please try again.',duplicate:'This account has already been added.'}};
function bankText(){return bankCopy[document.documentElement.lang==='en'?'en':'ar'];}
function bankMessage(text){bankStatus.hidden=false;bankStatus.textContent=text;}
function validateBankAccounts(value){if(!Array.isArray(value)||value.length>20||value.some(a=>!a||typeof a.id!=='string'||typeof a.accountHolder!=='string'||typeof a.maskedIban!=='string'))throw Error('Invalid accounts');value.forEach(a=>RePay.safeId(a.id));return value;}
function bankUpdate(){bankSave.disabled=bankBusy || !bankLoaded || !RePayBanking.validIban(bankIban.value) || !RePayBanking.validHolder(bankHolder.value);document.getElementById('bank-add').disabled=bankBusy;document.querySelectorAll('.bank-delete').forEach(b=>b.disabled=bankBusy||bankAccounts.length<=1);document.querySelectorAll('.bank-edit').forEach(b=>b.disabled=bankBusy);}
function bankElement(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function bankRender(){
 const t=bankText();const formVisible=bankShowForm||!bankAccounts.length;
 document.getElementById('bank-title').textContent=formVisible?t.add:t.saved;
 document.querySelector('label[for="bank-iban"]').textContent=t.iban;document.querySelector('label[for="bank-holder"]').textContent=t.name;bankHolder.placeholder=t.placeholder;bankSave.textContent=t.save;
 document.getElementById('bank-add').setAttribute('aria-label',t.addMore);document.getElementById('bank-add').title=t.addMore;document.getElementById('bank-paste').setAttribute('aria-label',t.paste);document.getElementById('bank-paste').title=t.paste;document.getElementById('bank-form-cancel').textContent=t.back;
 document.getElementById('bank-saved').hidden=formVisible;bankForm.hidden=!formVisible;document.getElementById('bank-form-cancel').hidden=!bankAccounts.length;
 const list=document.getElementById('bank-account-list');list.replaceChildren();
 for(const account of bankAccounts){
  const card=bankElement('div','saved-bank-card');const logo=bankElement('img');logo.src=window.REPAY_CONFIG.demo?'assets/banks/bank-01.png':RePayBanking.logo(account.bankLogoUrl);logo.alt='';logo.width=44;logo.height=44;
  const copy=bankElement('div');copy.append(bankElement('p','saved-holder',account.accountHolder));const iban=bankElement('bdi','saved-iban',account.maskedIban);iban.dir='ltr';copy.append(iban);
  const actions=bankElement('div','bank-card-actions');const menu=bankElement('div','bank-options-menu');menu.hidden=true;const more=bankElement('button','bank-more','⋯');more.type='button';more.setAttribute('aria-label',document.documentElement.lang==='en'?'Account options':'خيارات الحساب');more.setAttribute('aria-expanded','false');more.addEventListener('click',()=>{const opening=menu.hidden;closeBankMenus();menu.hidden=!opening;more.setAttribute('aria-expanded',String(opening));});const edit=bankElement('button','bank-edit',t.edit);edit.type='button';edit.addEventListener('click',()=>{if(bankBusy)return;bankEditing=account.id;bankShowForm=true;bankIban.value='';bankHolder.value=account.accountHolder;bankStatus.hidden=true;bankRender();});
  const remove=bankElement('button','bank-delete',t.remove);remove.type='button';remove.disabled=bankAccounts.length<=1;remove.title=bankAccounts.length<=1?t.last:t.remove;remove.addEventListener('click',()=>bankDelete(account.id));menu.append(edit,remove);actions.append(more,menu);card.append(logo,copy,actions);list.append(card);
 }
 bankUpdate();
}
async function bankDelete(id){
 if(bankBusy||bankAccounts.length<=1)return;bankBusy=true;bankUpdate();
 try{if(window.REPAY_CONFIG.demo)bankAccounts=bankAccounts.filter(a=>a.id!==id);else{const result=await window.REPAY_CONFIG.onDeleteBankAccount(id);const next=validateBankAccounts(result.accounts);if(!next.length)throw Error();bankAccounts=next;}bankStatus.hidden=true;}
 catch{bankMessage(bankText().deleteError);}finally{bankBusy=false;bankRender();}
}
document.getElementById('withdraw-button').addEventListener('click',async()=>{
 if(bankBusy)return;bankStatus.hidden=true;bankLoaded=false;bankShowForm=false;bankEditing=null;bankRender();bankSheet.showModal();bankBusy=true;bankUpdate();
 try{if(!window.REPAY_CONFIG.demo){const result=await window.REPAY_CONFIG.onLoadBankAccount();bankAccounts=validateBankAccounts(result.accounts);}bankLoaded=true;}
 catch{bankMessage(bankText().error);}finally{bankBusy=false;bankRender();}
});
document.getElementById('bank-close').addEventListener('click',()=>bankSheet.close());
document.getElementById('bank-add').addEventListener('click',()=>{if(bankBusy)return;bankEditing=null;bankShowForm=true;bankIban.value='';bankHolder.value='';bankStatus.hidden=true;bankRender();});
document.getElementById('bank-form-cancel').addEventListener('click',()=>{if(bankBusy)return;bankShowForm=false;bankEditing=null;bankRender();});
function bankNormalizeInput(){const normalized=RePayBanking.normalize(bankIban.value).replace(/[^SA0-9]/g,'').slice(0,24);bankIban.value=normalized.replace(/(.{4})/g,'$1 ').trim();bankUpdate();}
bankIban.addEventListener('input',bankNormalizeInput);bankHolder.addEventListener('input',bankUpdate);
document.getElementById('bank-paste').addEventListener('click',async()=>{if(bankBusy)return;try{bankIban.value=await navigator.clipboard.readText();bankNormalizeInput();}catch{bankMessage(bankText().pasteError);bankIban.focus();}});
bankForm.addEventListener('submit',async event=>{
 event.preventDefault();if(bankSave.disabled)return;
 const data={iban:RePayBanking.normalize(bankIban.value),accountHolder:bankHolder.value.trim(),...(bankEditing?{id:bankEditing}:{})};
 if(!RePayBanking.validIban(data.iban)||!RePayBanking.validHolder(data.accountHolder)){bankMessage(bankText().invalid);return;}
 bankBusy=true;bankIban.readOnly=bankHolder.readOnly=true;bankUpdate();
 try{
  if(window.REPAY_CONFIG.demo){
   const fingerprint=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data.iban));const hash=Array.from(new Uint8Array(fingerprint),n=>n.toString(16).padStart(2,'0')).join('');
   if(bankAccounts.some(a=>a.fingerprint===hash && a.id!==bankEditing))throw Error('duplicate');
   const account={id:bankEditing||crypto.randomUUID(),accountHolder:data.accountHolder,maskedIban:'SA•• •••• •••• •••• •••• '+data.iban.slice(-4),fingerprint:hash};
   bankAccounts=bankEditing?bankAccounts.map(a=>a.id===bankEditing?account:a):[...bankAccounts,account];bankMessage(bankText().demo);
  }else{const result=await window.REPAY_CONFIG.onSaveBankAccount(data);bankAccounts=validateBankAccounts(result.accounts);bankStatus.hidden=true;}
  bankIban.value='';bankShowForm=false;bankEditing=null;
 }catch(err){bankMessage(err.message==='duplicate'?bankText().duplicate:bankText().saveError);}
 finally{bankBusy=false;bankIban.readOnly=bankHolder.readOnly=false;bankRender();}
});
const resizeHandle=document.getElementById('bank-resize');
function expandBankSheet(expanded){bankSheet.classList.toggle('expanded',expanded);resizeHandle.setAttribute('aria-expanded',String(expanded));}
let bankDragged=false;
resizeHandle.addEventListener('click',()=>{if(bankDragged){bankDragged=false;return;}expandBankSheet(!bankSheet.classList.contains('expanded'));});
let dragStart=null;
resizeHandle.addEventListener('pointerdown',event=>{dragStart=event.clientY;resizeHandle.setPointerCapture(event.pointerId);});
resizeHandle.addEventListener('pointerup',event=>{if(dragStart===null)return;const delta=event.clientY-dragStart;if(Math.abs(delta)>30){bankDragged=true;expandBankSheet(delta<0);}dragStart=null;});
resizeHandle.addEventListener('pointercancel',()=>{dragStart=null;});

function closeBankMenus(){document.querySelectorAll('.bank-options-menu').forEach(menu=>menu.hidden=true);document.querySelectorAll('.bank-more').forEach(button=>button.setAttribute('aria-expanded','false'));}
bankSheet.addEventListener('click',event=>{if(!event.target.closest('.bank-card-actions'))closeBankMenus();});
bankSheet.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.bank-options-menu:not([hidden])')){event.preventDefault();const button=document.querySelector('.bank-more[aria-expanded="true"]');closeBankMenus();button?.focus();}});
