"use strict";
const form = document.getElementById("profile-form");
const fields = Array.from(form.querySelectorAll("input"));
const status = document.getElementById("profile-status");
const saveButton = document.getElementById("profile-save");
let originalValues = [];
let loaded = false;
let saving = false;
let currentProfile = null;
let avatarSelection = null;
let avatarDraft = null;
const avatarButton = document.getElementById("profile-avatar");
const avatarDialog = document.getElementById("avatar-dialog");
function message(text) { status.hidden = false; status.textContent = text; }
function changed() { return loaded && (avatarSelection !== null || fields.some((field, i) => field.value !== originalValues[i])); }
function updateSaveVisibility() { saveButton.hidden = !changed(); saveButton.disabled = saving; }
function applyProfile(data) {
  if (!data || typeof data.fullName !== "string" || typeof data.email !== "string" || typeof data.phone !== "string") throw Error("Invalid profile");
  currentProfile = data; avatarSelection = null; RePayAvatars.render(avatarButton,data,true);
  fields[0].value = data.fullName; fields[1].value = data.email; fields[2].value = RePay.digits(data.phone);
  document.getElementById("profile-name").textContent = data.fullName.trim().split(/\s+/)[0];
  originalValues = fields.map(field => field.value); loaded = true;
  fields.forEach(field => { field.readOnly = true; }); updateSaveVisibility();
}
form.addEventListener("input", () => { fields[2].value = RePay.digits(fields[2].value); updateSaveVisibility(); if(loaded)RePayAvatars.render(avatarButton,{...currentProfile,fullName:fields[0].value},true,avatarSelection); });
document.getElementById("edit-profile").addEventListener("click", () => { if (!loaded || saving) return; fields.forEach(field => { field.readOnly = false; }); fields[0].focus(); });
form.addEventListener("submit", async event => {
  event.preventDefault(); if (saving || !changed()) return;
  if (window.REPAY_CONFIG.demo) {
    if (avatarSelection) {
      try {
        localStorage.setItem("repay-demo-avatar-style",JSON.stringify(avatarSelection)); avatarSelection=null; updateSaveVisibility();
        message("تم حفظ صورة المعاينة على هذا الجهاز.");
      } catch { message("تعذر حفظ الصورة."); }
    } else message("هذه معاينة؛ البيانات لم تُحفظ على الخادم.");
    return;
  }
  const data = Object.fromEntries(new FormData(form)); data.fullName = data.fullName.trim();
  if (!data.fullName || !form.reportValidity()) return;
  saving = true; fields.forEach(field => { field.readOnly = true; }); updateSaveVisibility();
  try {
    if (avatarSelection) data.avatar=RePayAvatars.normalize(avatarSelection);
    const saved = await window.REPAY_CONFIG.onSaveProfile(data); applyProfile(saved); message("تم حفظ البيانات"); }
  catch { fields.forEach(field => { field.readOnly = false; }); message("تعذر حفظ البيانات. حاول مرة أخرى."); }
  finally { saving = false; updateSaveVisibility(); }
});
(async () => {
  try { applyProfile(window.REPAY_CONFIG.demo ? window.REPAY_DEMO.profile : await RePay.api("/api/profile")); }
  catch (error) { if (error.status === 401) location.replace("login.html"); else message("تعذر تحميل بيانات الحساب."); }
})();

const pickerPreview=document.getElementById('avatar-preview');
function renderAvatarDraft(){
 RePayAvatars.render(pickerPreview,{...currentProfile,fullName:fields[0].value},false,avatarDraft);
 document.querySelectorAll('[data-avatar-emoji]').forEach(button=>button.setAttribute('aria-pressed',String(avatarDraft.kind==='emoji'&&button.dataset.avatarEmoji===avatarDraft.emoji)));
 document.querySelectorAll('[data-avatar-choice-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarChoiceColor===avatarDraft.color)));
 document.getElementById('avatar-color-tab').setAttribute('aria-pressed',String(avatarDraft.kind==='initial'));
 document.getElementById('avatar-emoji-tab').setAttribute('aria-pressed',String(avatarDraft.kind==='emoji'));
 document.getElementById('avatar-color-panel').hidden=avatarDraft.kind!=='initial';
 document.getElementById('avatar-emoji-panel').hidden=avatarDraft.kind!=='emoji';
}
for(const emoji of RePayAvatars.emojis){
 const button=document.createElement('button');button.type='button';button.className='avatar-option avatar-emoji-option';button.textContent=emoji;button.dataset.avatarEmoji=emoji;button.setAttribute('aria-label',emoji);
 button.addEventListener('click',()=>{avatarDraft.kind='emoji';avatarDraft.emoji=emoji;renderAvatarDraft();});document.getElementById('avatar-grid').append(button);
}
const colorLabels={blue:'أزرق',mint:'أخضر',pink:'وردي',purple:'بنفسجي',yellow:'أصفر',peach:'خوخي',gray:'رمادي'};
for(const color of RePayAvatars.colors){
 const button=document.createElement('button');button.type='button';button.className='avatar-color-choice';button.dataset.avatarColor=color;button.dataset.avatarChoiceColor=color;button.setAttribute('aria-label',colorLabels[color]);
 button.addEventListener('click',()=>{avatarDraft.color=color;avatarDraft.kind='initial';renderAvatarDraft();});document.getElementById('avatar-colors').append(button);
}
avatarButton.addEventListener('click',()=>{if(!loaded||saving)return;avatarDraft={...(avatarSelection||RePayAvatars.selection(currentProfile,true))};renderAvatarDraft();avatarDialog.showModal();});
document.getElementById('avatar-color-tab').addEventListener('click',()=>{avatarDraft.kind='initial';renderAvatarDraft();});
document.getElementById('avatar-emoji-tab').addEventListener('click',()=>{avatarDraft.kind='emoji';renderAvatarDraft();});
document.getElementById('avatar-close').addEventListener('click',()=>avatarDialog.close());
document.getElementById('avatar-done').addEventListener('click',()=>{
 const current=RePayAvatars.selection(currentProfile,true);
 avatarSelection=JSON.stringify(avatarDraft)===JSON.stringify(current)?null:{...avatarDraft};
 RePayAvatars.render(avatarButton,{...currentProfile,fullName:fields[0].value},false,avatarDraft);updateSaveVisibility();avatarDialog.close();
});
