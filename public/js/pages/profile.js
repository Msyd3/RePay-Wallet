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
        RePayAvatars.save(currentProfile,avatarSelection); avatarSelection=null; updateSaveVisibility();
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
 RePayAvatars.render(pickerPreview,currentProfile,false,avatarDraft);
 document.querySelectorAll('[data-avatar-id]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarId===avatarDraft.id)));
}
for(const id of RePayAvatars.ids){
 const button=document.createElement('button');button.type='button';button.className='avatar-option remoji-option';button.dataset.avatarId=id;button.setAttribute('aria-label',`صورة الحساب ${RePayAvatars.ids.indexOf(id)+1}`);
 RePayAvatars.render(button,null,false,{id});
 button.addEventListener('click',()=>{avatarDraft={id};renderAvatarDraft();});document.getElementById('avatar-grid').append(button);
}
avatarButton.addEventListener('click',()=>{if(!loaded||saving)return;avatarDraft={...(avatarSelection||RePayAvatars.selection(currentProfile,true))};renderAvatarDraft();avatarDialog.showModal();});
document.getElementById('avatar-close').addEventListener('click',()=>avatarDialog.close());
document.getElementById('avatar-done').addEventListener('click',()=>{
 const current=RePayAvatars.selection(currentProfile,true);
 avatarSelection=JSON.stringify(avatarDraft)===JSON.stringify(current)?null:{...avatarDraft};
 RePayAvatars.render(avatarButton,{...currentProfile,fullName:fields[0].value},false,avatarDraft);updateSaveVisibility();avatarDialog.close();
});
