"use strict";
window.RePay = (() => {
  const digits = value => String(value ?? "").replace(/[٠-٩۰-۹]/g, d => String(d.charCodeAt(0) - (d >= "۰" ? 0x06F0 : 0x0660)));
  const phone = value => digits(value).replace(/\D/g, "").slice(0, 10);
  const validPhone = value => /^05\d{8}$/.test(value);
  const money = (minor, decimals = 2) => {
    if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid amount");
    return new Intl.NumberFormat("en-SA", { minimumFractionDigits: decimals, maximumFractionDigits: 2 }).format(minor / 100);
  };
  const safeId = value => {
    if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,160}$/.test(value)) throw new Error("Invalid ID");
    return value;
  };
  const validateReceipt = (data, id) => {
    if (!data || data.id !== id || data.currency !== "SAR" || !Number.isSafeInteger(data.amountMinor) || data.amountMinor <= 0 || !["pending", "paid", "failed", "cancelled"].includes(data.status)) throw new Error("Invalid receipt");
    return data;
  };
  async function api(path, { method = "GET", data } = {}) {
    const url = new URL(path, location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) throw new Error("Invalid API destination");
    const headers = { Accept: "application/json" };
    if (method !== "GET") {
      const session = await api("/api/session");
      if (typeof session.csrfToken !== "string" || !session.csrfToken) throw new Error("Missing CSRF token");
      headers["X-CSRF-Token"] = session.csrfToken;
      if (!(data instanceof FormData)) headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, { method, credentials: "same-origin", cache: "no-store", headers, ...(data ? { body: data instanceof FormData ? data : JSON.stringify(data) } : {}), signal: AbortSignal.timeout(15000) });
    if (!response.ok) { const error = new Error("API request failed"); error.status = response.status; throw error; }
    if (response.status === 204) return {};
    return response.json();
  }
  function clearChallenge() { for (const key of ["repay-otp-challenge", "repay-otp-deadline", "repay-otp-demo"]) sessionStorage.removeItem(key); }
  return { digits, phone, validPhone, money, safeId, validateReceipt, api, clearChallenge };
})();
