"use strict";
const config = window.REPAY_CONFIG || { demo: false };
const params = new URLSearchParams(location.search);
const translations = {
  ar: { addNote: "+ إضافة ملاحظة", noteLabel: "ملاحظة (اختياري)", notePlaceholder: "أضف ملاحظة…", title: "ملخص العملية", sender: "المرسل", recipient: "المستفيد", amount: "المبلغ", cancel: "إلغاء", pay: "دفع باستخدام", account: "من حساب", unavailable: "تعذر تحميل بيانات العملية. يرجى المحاولة مجددًا.", pending: "جارٍ معالجة الطلب…", cancelled: "تم إلغاء العملية", paid: "تم تأكيد الدفع", failed: "تعذر إكمال الطلب. يرجى المحاولة مجددًا." },
  en: { addNote: "+ Add a note", noteLabel: "Note (optional)", notePlaceholder: "Add a note…", title: "Summary", sender: "Sender", recipient: "Recipient", amount: "Amount", cancel: "Cancel", pay: "Pay with", account: "From", unavailable: "Unable to load this transaction. Please try again.", pending: "Processing your request…", cancelled: "Transaction cancelled", paid: "Payment confirmed", failed: "Unable to complete the request. Please try again." }
};
let language = params.get("lang") === "en" ? "en" : "ar";
let transaction = null;
let busy = false;
let terminal = false;
let statusKey = null;
let expiryAt = 0;
let expiryTimer = null;
const summaryLifetimeMs = 5 * 60 * 1000;
const byId = (id) => document.getElementById(id);
const englishDigits = RePay.digits;
const text = (value) => typeof value === "string" ? englishDigits(value.trim().slice(0, 160)) : "";
function setStatus(key) {
  statusKey = key;
  byId("payment-status").hidden = !key;
  byId("payment-status").textContent = key ? translations[language][key] : "";
}
function goToExpired() {
  const target = new URL("/expired/", location.origin);
  target.search = new URLSearchParams({ lang: language });
  location.replace(target.href);
}
function enforceExpiry(transactionId) {
  const key = `repay-summary-expiry:${transactionId}`;
  const saved = Number(sessionStorage.getItem(key));
  expiryAt = Number.isFinite(saved) && saved > 0 ? saved : Date.now() + summaryLifetimeMs;
  if (!saved) sessionStorage.setItem(key, String(expiryAt));
  const remaining = expiryAt - Date.now();
  if (remaining <= 0) { goToExpired(); return true; }
  if (expiryTimer) clearTimeout(expiryTimer);
  expiryTimer = setTimeout(goToExpired, remaining);
  return false;
}
function checkExpiry() {
  if (expiryAt && Date.now() >= expiryAt) goToExpired();
}
function render() {
  const t = translations[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.title = `RePay confirm | ${t.title}`;
  byId("summary-title").textContent = t.title;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.dataset.i18n]; });
  byId("language-toggle").textContent = language === "ar" ? "EN" : "عربي";
  byId("language-toggle").setAttribute("aria-label", language === "ar" ? "Switch to English" : "التبديل للعربية");
  if (transaction) {
    for (const role of ["sender", "recipient"]) {
      const name = transaction[role].name;
      byId(`${role}-name`).textContent = name;
      byId(`${role}-name`).hidden = !name;
      byId(`${role}-phone`).textContent = transaction[role].phone;
      if (RePayAvatars.ids.includes(transaction[role].avatar?.id)) {
        RePayAvatars.render(byId(`${role}-avatar`), transaction[role]);
      }
    }
    byId("amount-value").textContent = new Intl.NumberFormat("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transaction.amountMinor / 100);
    byId("currency-label").hidden = false;
    byId("currency-label").querySelector("img").alt = language === "ar" ? "ريال سعودي" : "Saudi riyal";
  }
  byId("transaction-note").placeholder = t.notePlaceholder;
  byId("transaction-note").setAttribute("aria-label", t.noteLabel);
  byId("transaction-note").readOnly = busy || terminal;
  setStatus(statusKey);
  for (const action of ["pay", "cancel"]) byId(`${action}-button`).disabled = !transaction || busy || terminal || (!config.demo && typeof config[action === "pay" ? "onPay" : "onCancel"] !== "function");
}
function validate(data) {
  if (!data || !text(data.id) || !Number.isSafeInteger(data.amountMinor) || data.amountMinor <= 0 || data.currency !== "SAR" || !text(data.sender?.name) || !text(data.accountName)) throw new Error("Invalid transaction");
  return { id: text(data.id), status: data.status, accountName: text(data.accountName), sender: { id:data.sender.id, avatar:data.sender.avatar, name: text(data.sender.name), phone: text(data.sender.phone) }, recipient: { id:data.recipient.id, avatar:data.recipient.avatar, name: text(data.recipient.name), phone: text(data.recipient.phone) }, amountMinor: data.amountMinor, currency: "SAR", note: typeof data.note === "string" ? data.note.trim().slice(0, 500) : "" };
}
async function loadSavedAvatars(current) {
  try {
    const endpoint = new URL('https://repay-control-api.onrender.com/api/wallet/avatars');
    endpoint.searchParams.set('id', current.id);
    const response = await fetch(endpoint, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(7000) });
    if (!response.ok || transaction !== current) return;
    const avatars = await response.json();
    if (transaction !== current) return;
    for (const role of ['sender', 'recipient']) {
      if (RePayAvatars.ids.includes(avatars[role])) {
        current[role].avatar = { id: avatars[role] };
        RePayAvatars.render(byId(`${role}-avatar`), current[role]);
      }
    }
  } catch { /* A saved avatar can be retried on the next visit. */ }
  finally {
    if (transaction === current) {
      for (const role of ['sender', 'recipient']) {
        if (!RePayAvatars.ids.includes(current[role].avatar?.id)) {
          current[role].avatar = RePayAvatars.selection(current[role]);
          RePayAvatars.render(byId(`${role}-avatar`), current[role]);
        }
      }
    }
  }
}

async function load() {
  // Start the five-minute timer immediately: it must still expire even if the
  // transaction API is slow or unavailable.
  const expiryId = params.get("id");
  if (expiryId && enforceExpiry(expiryId)) return;
  if (config.demo) {
    transaction = validate(window.REPAY_DEMO.transaction);
  } else {
    for (const id of ["sender-name", "sender-phone", "recipient-name", "recipient-phone", "amount-value"]) byId(id).textContent = "—";
    byId("currency-label").hidden = true;
    try {
      const id = RePay.safeId(params.get("id"));
      if (!id) throw new Error("Missing transaction ID");
      const endpoint = new URL(config.transactionEndpoint);
      if (endpoint.protocol !== "https:" || endpoint.origin !== config.transactionApiOrigin || endpoint.search || endpoint.hash) throw new Error("Invalid endpoint");
      endpoint.pathname = endpoint.pathname.replace(/\/?$/, "/") + encodeURIComponent(id);
      const response = await fetch(endpoint, { credentials: "omit", cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
      // An expired server-side request is deliberately unavailable and must
      // never be shown as a generic loading error.
      if (response.status === 404 || response.status === 410) { goToExpired(); return; }
      if (!response.ok) throw new Error("Unable to load");
      transaction = validate(RePay.validateReceipt(await response.json(), id));
      if (transaction.id !== id) throw new Error("Transaction mismatch");
      void loadSavedAvatars(transaction);
      byId("transaction-note").value = transaction.note;
      if (transaction.status !== "pending") {
        terminal = true;
        if (transaction.status === "paid") {
          const target = new URL("/success/", location.origin);
          target.search = new URLSearchParams({ id, lang: language }); location.replace(target.href);
        } else setStatus(transaction.status === "cancelled" ? "cancelled" : "failed");
      }
    } catch { transaction = null; setStatus("unavailable"); }
  }
  render();
}
async function act(action) {
  if (!transaction || busy || terminal) return;
  if (Date.now() >= expiryAt) { goToExpired(); return; }
  const handler = config[action === "pay" ? "onPay" : "onCancel"];
  window.dispatchEvent(new CustomEvent(`repay:${action === "pay" ? "payment" : "cancel"}-request`, { detail: { transactionId: transaction.id, demo: !!config.demo } }));
  if (typeof handler !== "function") return;
  busy = true; setStatus("pending"); render();
  try {
    const result = await handler({ transactionId: transaction.id, ...(action === "pay" ? { note: byId("transaction-note").value.trim() } : {}) });
    if (action === "pay" && result?.status === "failed") {
      terminal = true;
      const target = new URL("/failure/", location.origin);
      target.search = new URLSearchParams({ lang: language });
      location.assign(target.href);
      return;
    }
    const expected = action === "pay" ? "paid" : "cancelled";
    if (result?.status !== expected) throw new Error("Not confirmed");
    terminal = true; setStatus(expected);
    if (action === "pay") {
      const target = new URL("/success/", location.origin);
      target.search = new URLSearchParams({ id: transaction.id, lang: language });
      location.assign(target.href);
    }
  } catch { setStatus("failed"); }
  finally { busy = false; render(); }
}
window.addEventListener("pageshow", checkExpiry);
window.addEventListener("focus", checkExpiry);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkExpiry(); });
byId("language-toggle").addEventListener("click", () => { language = language === "ar" ? "en" : "ar"; render(); });
byId("pay-button").addEventListener("click", () => act("pay"));
byId("cancel-button").addEventListener("click", () => act("cancel"));
document.querySelectorAll(".emoji-choice[data-emoji]").forEach((button) => {
  button.addEventListener("click", () => {
    const note = byId("transaction-note");
    if (busy || terminal) return;
    const emoji = button.dataset.emoji;
    const start = note.selectionStart;
    const end = note.selectionEnd;
    if (note.value.length - (end - start) + emoji.length > note.maxLength) return;
    note.setRangeText(emoji, start, end, "end");
    note.dispatchEvent(new Event("input", { bubbles: true }));
    byId("emoji-picker").hidden = true;
    byId("emoji-more").setAttribute("aria-expanded", "false");
    note.focus();
  });
});
byId("emoji-more").addEventListener("click", () => {
  const picker = byId("emoji-picker");
  picker.hidden = !picker.hidden;
  byId("emoji-more").setAttribute("aria-expanded", String(!picker.hidden));
});
byId("emoji-picker").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    byId("emoji-picker").hidden = true;
    byId("emoji-more").setAttribute("aria-expanded", "false");
    byId("emoji-more").focus();
  }
});
render();
load();
