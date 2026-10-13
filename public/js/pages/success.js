"use strict";
const successConfig = window.REPAY_CONFIG || { demo: false };
const successParams = new URLSearchParams(location.search);
const successLanguage = successParams.get("lang") === "en" ? "en" : "ar";
const copy = successLanguage === "ar" ? {
  loading: "جارٍ التحقق من حالة العملية…", success: "تمت معالجة العملية بنجاح", back: "عودة", pending: "العملية قيد المعالجة", failed: "تعذر تأكيد نجاح العملية", currency: "ريال سعودي"
} : {
  loading: "Checking transaction status…", success: "Transaction processed successfully", back: "Return", pending: "Transaction is being processed", failed: "Unable to confirm this transaction", currency: "Saudi riyal"
};
document.documentElement.lang = successLanguage;
document.documentElement.dir = successLanguage === "ar" ? "rtl" : "ltr";
document.getElementById("return-button").textContent = copy.back;
document.getElementById("result-message").textContent = copy.loading;
document.querySelector(".success-amount img").alt = copy.currency;
async function verifySuccess() {
  try {
    let data;
    if (successConfig.demo) {
      // Screenshot preview only; never used when demo is false.
      data = window.REPAY_DEMO.receipt;
    } else {
      const id = RePay.safeId(successParams.get("id"));
      if (!id || id.length > 160) throw new Error("Missing ID");
      const endpoint = new URL(successConfig.transactionEndpoint, location.origin);
      if (endpoint.origin !== location.origin || endpoint.search || endpoint.hash) throw new Error("Invalid endpoint");
      endpoint.pathname = endpoint.pathname.replace(/\/?$/, "/") + encodeURIComponent(id);
      const response = await fetch(endpoint, { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Unable to verify");
      data = RePay.validateReceipt(await response.json(), id);
      if (data.id !== id) throw new Error("Mismatched ID");
    }
    if (data.status === "failed") {
      const target = new URL("failure.html", location.href);
      target.search = new URLSearchParams({ lang: successLanguage });
      location.replace(target.href);
      return;
    }
    if (data.status !== "paid") {
      document.getElementById("result-message").textContent = data.status === "pending" ? copy.pending : copy.failed;
      document.querySelector(".success-page").classList.add("is-error");
      return;
    }
    if (!Number.isSafeInteger(data.amountMinor) || data.amountMinor <= 0 || data.currency !== "SAR") throw new Error("Invalid amount");
    document.getElementById("success-value").textContent = new Intl.NumberFormat("en-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(data.amountMinor / 100);
    document.getElementById("success-icon").removeAttribute("hidden");
    document.getElementById("success-amount").hidden = false;
    document.getElementById("result-message").textContent = copy.success;
    document.title = `RePay | ${copy.success}`;
  } catch {
    document.getElementById("result-message").textContent = copy.failed;
    document.querySelector(".success-page").classList.add("is-error");
  } finally {
    document.getElementById("result").setAttribute("aria-busy", "false");
  }
}
verifySuccess();
