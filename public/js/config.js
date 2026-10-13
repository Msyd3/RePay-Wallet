"use strict";
// The production build always starts without demo data.
window.REPAY_CONFIG = Object.freeze({
  demo: false,
  transactionEndpoint: "/api/transactions/",
  onRequestOtp: data => RePay.api("/api/auth/otp/request", { method: "POST", data }),
  onVerifyOtp: data => RePay.api("/api/auth/otp/verify", { method: "POST", data }),
  onResendOtp: data => RePay.api("/api/auth/otp/resend", { method: "POST", data }),
  onLogout: async () => { await RePay.api("/api/auth/logout", { method: "POST" }); RePay.clearChallenge(); },
  onSaveProfile: data => RePay.api("/api/profile", { method: "PATCH", data }),
  // Connect the approved payment provider SDK and server verification before enabling payment.
  onPay: null,
  onCancel: ({ transactionId }) => RePay.api(`/api/transactions/${RePay.safeId(transactionId)}/cancel`, { method: "POST" })
});
