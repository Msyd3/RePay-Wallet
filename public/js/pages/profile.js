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
let previewUrl = null;
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
form.addEventListener("input", () => { fields[2].value = RePay.digits(fields[2].value); updateSaveVisibility(); });
document.getElementById("edit-profile").addEventListener("click", () => { if (!loaded || saving) return; fields.forEach(field => { field.readOnly = false; }); fields[0].focus(); });
form.addEventListener("submit", async event => {
  event.preventDefault(); if (saving || !changed()) return;
  if (window.REPAY_CONFIG.demo) {
    if (avatarSelection) {
      try {
        const stored = avatarSelection.id || await new Promise((resolve,reject) => { const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(avatarSelection.blob); });
        localStorage.setItem("repay-demo-avatar",stored); avatarSelection=null; updateSaveVisibility();
        message("تم حفظ صورة المعاينة على هذا الجهاز.");
      } catch { message("تعذر حفظ الصورة."); }
    } else message("هذه معاينة؛ البيانات لم تُحفظ على الخادم.");
    return;
  }
  const data = Object.fromEntries(new FormData(form)); data.fullName = data.fullName.trim();
  if (!data.fullName || !form.reportValidity()) return;
  saving = true; fields.forEach(field => { field.readOnly = true; }); updateSaveVisibility();
  try {
    if (avatarSelection?.blob) {
      const upload = new FormData();upload.append("avatar",avatarSelection.blob,"avatar.jpg");
      const uploaded = await window.REPAY_CONFIG.onUploadAvatar(upload);
      if (!RePayAvatars.safeUrl(uploaded?.avatarUrl)) throw Error("Invalid avatar response");
      data.avatarUrl=uploaded.avatarUrl;
    } else if (avatarSelection?.id) data.avatarId=avatarSelection.id;
    const saved = await window.REPAY_CONFIG.onSaveProfile(data); applyProfile(saved); message("تم حفظ البيانات"); }
  catch { fields.forEach(field => { field.readOnly = false; }); message("تعذر حفظ البيانات. حاول مرة أخرى."); }
  finally { saving = false; updateSaveVisibility(); }
});
(async () => {
  try { applyProfile(window.REPAY_CONFIG.demo ? window.REPAY_DEMO.profile : await RePay.api("/api/profile")); }
  catch (error) { if (error.status === 401) location.replace("login.html"); else message("تعذر تحميل بيانات الحساب."); }
})();

function selectAvatar(selection,src) {
 if(saving)return;
 if(previewUrl)URL.revokeObjectURL(previewUrl);
 previewUrl=selection.blob?src:null;avatarSelection=selection;
 const img=document.createElement("img");img.src=src;img.alt="";img.className="user-avatar-image";avatarButton.replaceChildren(img);
 updateSaveVisibility();avatarDialog.close();
}
for(const preset of RePayAvatars.presets) {
 const button=document.createElement("button");button.type="button";button.className="avatar-option";button.dataset.avatarId=preset.id;button.setAttribute("aria-label",preset.label);
 const img=document.createElement("img");img.src=preset.src;img.alt="";img.className="user-avatar-image";button.append(img);
 button.addEventListener("click",()=>selectAvatar({id:preset.id},preset.src));document.getElementById("avatar-grid").append(button);
}
avatarButton.addEventListener("click",()=>{
 if(!loaded || saving)return;
 document.querySelectorAll(".avatar-option").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.avatarId===(avatarSelection?.id || currentProfile.avatarId))));
 avatarDialog.showModal();
});
document.getElementById("avatar-close").addEventListener("click",()=>avatarDialog.close());
const fileInput=document.getElementById("avatar-file");
document.getElementById("avatar-album").addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",async()=>{
 const error=document.getElementById("avatar-error");error.hidden=true;
 try { const blob=await RePayAvatars.album(fileInput.files[0]);selectAvatar({blob},URL.createObjectURL(blob)); }
 catch(err){error.hidden=false;error.textContent=err.message;}
 finally{fileInput.value="";}
});
window.addEventListener("pagehide",()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);});
