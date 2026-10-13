"use strict";
const form = document.getElementById("profile-form");
const fields = Array.from(form.querySelectorAll("input"));
const status = document.getElementById("profile-status");
const saveButton = document.getElementById("profile-save");
let originalValues = [];
let loaded = false;
let saving = false;
function message(text) { status.hidden = false; status.textContent = text; }
function changed() { return loaded && fields.some((field, i) => field.value !== originalValues[i]); }
function updateSaveVisibility() { saveButton.hidden = !changed(); saveButton.disabled = saving; }
function applyProfile(data) {
  if (!data || typeof data.fullName !== "string" || typeof data.email !== "string" || typeof data.phone !== "string") throw Error("Invalid profile");
  fields[0].value = data.fullName; fields[1].value = data.email; fields[2].value = RePay.digits(data.phone);
  document.getElementById("profile-name").textContent = data.fullName.trim().split(/\s+/)[0];
  originalValues = fields.map(field => field.value); loaded = true;
  fields.forEach(field => { field.readOnly = true; }); updateSaveVisibility();
}
form.addEventListener("input", () => { fields[2].value = RePay.digits(fields[2].value); updateSaveVisibility(); });
document.getElementById("edit-profile").addEventListener("click", () => { if (!loaded || saving) return; fields.forEach(field => { field.readOnly = false; }); fields[0].focus(); });
form.addEventListener("submit", async event => {
  event.preventDefault(); if (saving || !changed()) return;
  if (window.REPAY_CONFIG.demo) { message("هذه معاينة؛ البيانات لم تُحفظ على الخادم."); return; }
  const data = Object.fromEntries(new FormData(form)); data.fullName = data.fullName.trim();
  if (!data.fullName || !form.reportValidity()) return;
  saving = true; fields.forEach(field => { field.readOnly = true; }); updateSaveVisibility();
  try { const saved = await window.REPAY_CONFIG.onSaveProfile(data); applyProfile(saved); message("تم حفظ البيانات"); }
  catch { fields.forEach(field => { field.readOnly = false; }); message("تعذر حفظ البيانات. حاول مرة أخرى."); }
  finally { saving = false; updateSaveVisibility(); }
});
(async () => {
  try { applyProfile(window.REPAY_CONFIG.demo ? window.REPAY_DEMO.profile : await RePay.api("/api/profile")); }
  catch (error) { if (error.status === 401) location.replace("login.html"); else message("تعذر تحميل بيانات الحساب."); }
})();
