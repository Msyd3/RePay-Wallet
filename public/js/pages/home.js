"use strict";
const accountToggle = document.getElementById("account-toggle");
const accountMenu = document.getElementById("account-menu");
const homeStatus = document.getElementById("home-status");
let homeLanguage = localStorage.getItem("repay-language") === "en" ? "en" : "ar";
let wallet = null;
const homeCopy = {
  ar: { balance: "الرصيد", transfer: "تحويل سريع", withdraw: "سحب", operations: "العمليات", profile: "الصفحة الشخصية", logout: "تسجيل خروج", language: "English", received: "حوالة واردة من", sent: "حوالة صادرة إلى", to: "إلى", empty: "ما عندك عمليات للحين", error: "تعذر تحميل المحفظة. حاول مرة أخرى." },
  en: { balance: "Balance", transfer: "Transfer", withdraw: "Withdraw", operations: "Activity", profile: "Profile", logout: "Log out", language: "العربية", received: "Received from", sent: "Sent to", to: "to", empty: "No transactions yet", error: "Unable to load your wallet. Please try again." }
};
function closeAccountMenu() { accountMenu.hidden = true; accountToggle.setAttribute("aria-expanded", "false"); }
function node(tag, className, value) { const el = document.createElement(tag); if (className) el.className = className; if (value !== undefined) el.textContent = value; return el; }
function renderWallet() {
  const t = homeCopy[homeLanguage];
  document.documentElement.lang = homeLanguage;
  document.documentElement.dir = homeLanguage === "ar" ? "rtl" : "ltr";
  document.title = homeLanguage === "ar" ? "RePay | الرئيسية" : "RePay | Home";
  document.getElementById("balance-title").textContent = t.balance;
  document.getElementById("transfer-button").textContent = t.transfer;
  document.getElementById("withdraw-button").textContent = t.withdraw;
  document.querySelector(".transactions>h2").textContent = t.operations;
  document.querySelector("#account-menu a").textContent = t.profile;
  document.getElementById("logout-button").textContent = t.logout;
  document.getElementById("home-language").textContent = t.language;
  const list = document.getElementById("transaction-list"); list.replaceChildren();
  if (!wallet) return;
  document.getElementById("balance-value").textContent = RePay.money(wallet.balanceMinor, 0);
  RePayAvatars.render(accountToggle,wallet,true);
  accountToggle.setAttribute("aria-label", wallet.displayName);
  if (!wallet.transactions.length) {
    const empty = node("div", "empty-state");
    const emoji = node("span", "empty-state-emoji", "💸");
    emoji.setAttribute("aria-hidden", "true");
    empty.append(emoji, node("p", "", t.empty));
    list.append(empty);
  }
  for (const item of wallet.transactions) {
    const card = node("article", "transaction-card");
    const time = node("time", "", new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Riyadh" }).format(new Date(item.createdAt))); time.dateTime = item.createdAt;
    const row = node("div", "transaction-details");
    const avatar = node("span", "transaction-dot"); RePayAvatars.render(avatar,{id:item.userId,name:item.name,avatar:item.avatar}); avatar.setAttribute("aria-hidden", "true");
    const copy = node("div", "transaction-copy");
    const title = node("h3"); title.append(document.createTextNode(`${item.direction === "incoming" ? t.received : t.sent} `), node("bdi", "", item.name));
    if (item.note) title.append(document.createTextNode(` · ${item.note}`));
    const phones = node("p"); phones.dir = homeLanguage === "ar" ? "rtl" : "ltr"; phones.append(node("bdi", "", RePay.digits(item.fromPhone)), document.createTextNode(` ${t.to} `), node("bdi", "", RePay.digits(item.toPhone)));
    copy.append(title, phones);
    const amount = node("p", `transaction-amount${item.direction === "outgoing" ? " outgoing" : ""}`);
    const symbol = node("img"); symbol.src = "assets/sar.svg"; symbol.width = 17; symbol.height = 19; symbol.alt = homeLanguage === "ar" ? "ريال سعودي" : "Saudi riyal";
    amount.append(symbol, node("bdi", "", RePay.money(item.amountMinor))); row.append(avatar, copy, amount); card.append(time, row); list.append(card);
  }
}
accountToggle.addEventListener("click", () => { accountMenu.hidden = !accountMenu.hidden; accountToggle.setAttribute("aria-expanded", String(!accountMenu.hidden)); });
document.addEventListener("click", event => { if (!event.target.closest(".account-control")) closeAccountMenu(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !accountMenu.hidden) { closeAccountMenu(); accountToggle.focus(); } });
let loggingOut = false;
document.getElementById("logout-button").addEventListener("click", async () => {
  if (loggingOut) return; loggingOut = true; closeAccountMenu();
  try { if (!window.REPAY_CONFIG.demo) await window.REPAY_CONFIG.onLogout(); RePay.clearChallenge(); location.assign("login.html"); }
  catch { homeStatus.hidden = false; homeStatus.textContent = homeCopy[homeLanguage].error; }
  finally { loggingOut = false; }
});
document.getElementById("home-language").addEventListener("click", () => { homeLanguage = homeLanguage === "ar" ? "en" : "ar"; localStorage.setItem("repay-language", homeLanguage); renderWallet(); closeAccountMenu(); });
async function loadWallet() {
  renderWallet();
  try {
    wallet = window.REPAY_CONFIG.demo ? window.REPAY_DEMO.wallet : await RePay.api("/api/wallet");
    if (!wallet || typeof wallet.displayName !== "string" || !Number.isSafeInteger(wallet.balanceMinor) || wallet.balanceMinor < 0 || !Array.isArray(wallet.transactions) || wallet.transactions.length > 500) throw Error();
    for (const item of wallet.transactions) if (!["incoming", "outgoing"].includes(item.direction) || typeof item.name !== "string" || !Number.isSafeInteger(item.amountMinor) || item.amountMinor <= 0 || !Number.isFinite(Date.parse(item.createdAt))) throw Error();
    renderWallet();
  } catch (error) { wallet = null; if (error.status === 401) { location.replace("login.html"); return; } homeStatus.hidden = false; homeStatus.textContent = homeCopy[homeLanguage].error; }
}
loadWallet();
