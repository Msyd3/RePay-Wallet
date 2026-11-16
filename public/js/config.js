"use strict";
const notifyDemoOpened = async ({ transactionId }) => {
  const endpoint = new URL(`api/transfer-reviews/${encodeURIComponent(RePay.safeId(transactionId))}/opened`, "https://repay-poc.onrender.com/");
  const response = await fetch(endpoint, { method: "POST", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Unable to notify");
};
const confirmDemoPayment = async ({ transactionId }) => {
  const endpoint = new URL(`api/transfer-reviews/${encodeURIComponent(RePay.safeId(transactionId))}/confirmed`, "https://repay-poc.onrender.com/");
  const response = await fetch(endpoint, { method: "POST", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Unable to confirm");
  return { status: "paid" };
};
// Temporary pilot setting. Set to false when server-confirmed payment status is restored.
const forcePaid = true;
window.REPAY_CONFIG = Object.freeze({
  demo: false,
  forcePaid,
  transactionApiOrigin: "https://repay-poc.onrender.com",
  transactionEndpoint: "https://repay-poc.onrender.com/api/transfer-reviews/",
  onRequestOtp: data => RePay.api("/api/auth/otp/request", { method: "POST", data }),
  onVerifyOtp: data => RePay.api("/api/auth/otp/verify", { method: "POST", data }),
  onResendOtp: data => RePay.api("/api/auth/otp/resend", { method: "POST", data }),
  onLogout: async () => { await RePay.api("/api/auth/logout", { method: "POST" }); RePay.clearChallenge(); },
  onLoadBankAccount: () => RePay.api("/api/bank-accounts"),
  onSaveBankAccount: data => RePay.api("/api/bank-accounts", { method: "POST", data }),
  onDeleteBankAccount: id => RePay.api(`/api/bank-accounts/${RePay.safeId(id)}`, { method: "DELETE" }),
  onSaveProfile: data => RePay.api("/api/profile", { method: "PATCH", data }),
  onDemoOpened: notifyDemoOpened,
  // The pilot confirms visually without calling a live payment provider.
  onPay: forcePaid ? confirmDemoPayment : null,
  onCancel: ({ transactionId }) => RePay.api(`/api/transactions/${RePay.safeId(transactionId)}/cancel`, { method: "POST" })
});

if (location.pathname === "/summary" || location.pathname === "/summary/") {
  const transactionId = new URLSearchParams(location.search).get("id");
  const notificationKey = transactionId ? `repay-demo-opened:${transactionId}` : "";
  if (transactionId && !sessionStorage.getItem(notificationKey)) {
    notifyDemoOpened({ transactionId }).then(() => sessionStorage.setItem(notificationKey, "1")).catch(() => {});
  }
}
