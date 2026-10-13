"use strict";
const otpConfig = window.REPAY_CONFIG || {};
const otpInput = document.getElementById("otp-code");
const next = document.getElementById("login-next");
const resend = document.getElementById("resend-code");
const timer = document.getElementById("resend-timer");
const status = document.getElementById("login-status");
const demo = !!otpConfig.demo && sessionStorage.getItem("repay-otp-demo") === "true";
let challengeId = sessionStorage.getItem("repay-otp-challenge");
try { if (challengeId) RePay.safeId(challengeId); } catch { challengeId = null; RePay.clearChallenge(); }
let deadline = Number(sessionStorage.getItem("repay-otp-deadline"));
if (!deadline || !Number.isFinite(deadline)) deadline = Date.now() + 60000;
let busy = false;
function message(text) { status.hidden = false; status.textContent = text; }
function update() {
 const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
 timer.textContent = seconds ? ` ${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}` : "";
 resend.disabled = busy || seconds > 0 || (!challengeId && !demo);
 next.disabled = busy || !/^\d{6}$/.test(otpInput.value) || (!challengeId && !demo);
}
if (!challengeId && !demo) message("ارجع لصفحة الدخول لطلب رمز التحقق.");
otpInput.addEventListener("input", () => { otpInput.value = otpInput.value.replace(/[٠-٩۰-۹]/g, d => String(d.charCodeAt(0) - (d >= "۰" ? 0x06F0 : 0x0660))).replace(/\D/g, "").slice(0,6); update(); });
document.getElementById("otp-form").addEventListener("submit", async event => {
 event.preventDefault(); if (next.disabled) return;
 if (typeof otpConfig.onVerifyOtp !== "function") { message("التحقق من الرمز يحتاج ربط خدمة تسجيل الدخول."); return; }
 busy = true; update();
 try {
  const result = await otpConfig.onVerifyOtp({ challengeId, code: otpInput.value });
  if (result?.status !== "verified") throw Error();
  sessionStorage.removeItem("repay-otp-challenge"); sessionStorage.removeItem("repay-otp-deadline"); sessionStorage.removeItem("repay-otp-demo");
  location.assign("home.html");
 } catch { message("الرمز غير صحيح أو منتهي الصلاحية. حاول مرة أخرى."); }
 finally { busy = false; update(); }
});
resend.addEventListener("click", async () => {
 if (resend.disabled) return;
 busy = true; update();
 try {
  if (!demo) {
   if (typeof otpConfig.onResendOtp !== "function") throw Error();
   const result = await otpConfig.onResendOtp({ challengeId });
   if (result?.status !== "sent") throw Error();
   if (result.challengeId) { challengeId = RePay.safeId(result.challengeId); sessionStorage.setItem("repay-otp-challenge", challengeId); }
  }
  deadline = Date.now() + 60000; sessionStorage.setItem("repay-otp-deadline", String(deadline));
  message(demo ? "معاينة إعادة الإرسال؛ لم يُرسل رمز فعلي." : "تم إرسال رمز جديد");
 } catch { message("تعذر إرسال الرمز. حاول مرة أخرى."); }
 finally { busy = false; update(); }
});
update(); setInterval(update, 1000);
