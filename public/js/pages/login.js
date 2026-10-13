"use strict";
const loginForm = document.getElementById("login-form");
const phoneInput = document.getElementById("login-phone");
const loginStatus = document.getElementById("login-status");
const loginNext = document.getElementById("login-next");
let requestingOtp = false;
function updateNextButton() { loginNext.disabled = requestingOtp || !/^05\d{8}$/.test(phoneInput.value); }
updateNextButton();
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06F0 : 0x0660))).replace(/\D/g, "").slice(0,10);
  phoneInput.setCustomValidity("");
  updateNextButton();
});
loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (requestingOtp) return;
  if (!/^05\d{8}$/.test(phoneInput.value)) {
    phoneInput.setCustomValidity("أدخل رقم جوال صحيح يبدأ بـ 05 ويتكون من 10 أرقام.");
    phoneInput.reportValidity(); return;
  }
  loginStatus.hidden = false;
  const handler = window.REPAY_CONFIG?.onRequestOtp;
  if (typeof handler !== "function" && window.REPAY_CONFIG?.demo) { sessionStorage.setItem("repay-otp-demo", "true"); sessionStorage.setItem("repay-otp-deadline", String(Date.now() + 60000)); location.assign("otp.html"); return; }
  if (typeof handler !== "function") { loginStatus.textContent = "الواجهة جاهزة؛ إرسال رمز التحقق يحتاج ربط خدمة تسجيل الدخول."; return; }
  requestingOtp = true;
  updateNextButton();
  loginStatus.textContent = "جارٍ إرسال رمز التحقق…";
  try {
    const result = await handler({ phone: "+966" + phoneInput.value.slice(1) });
    if (result?.status !== "sent") throw new Error("Not sent");
    if (typeof result.challengeId !== "string" || !/^[a-zA-Z0-9_-]{1,160}$/.test(result.challengeId)) throw new Error("Missing challenge");
    sessionStorage.setItem("repay-otp-challenge", result.challengeId);
    sessionStorage.setItem("repay-otp-deadline", String(Date.now() + 60000));
    sessionStorage.removeItem("repay-otp-demo");
    location.assign("otp.html");
    window.dispatchEvent(new CustomEvent("repay:otp-sent"));
  } catch { loginStatus.textContent = "تعذر إرسال رمز التحقق. حاول مرة أخرى."; }
  finally { requestingOtp = false; updateNextButton(); }
});
