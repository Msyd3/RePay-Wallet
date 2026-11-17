"use strict";
const failureLanguage = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "ar";
document.documentElement.lang = failureLanguage;
document.documentElement.dir = failureLanguage === "ar" ? "rtl" : "ltr";
if (failureLanguage === "en") {
  document.getElementById("result-message").textContent = "Unable to complete the transaction";
  document.getElementById("failure-description").textContent = "We couldn't complete the transaction. Please try again.";
  document.getElementById("return-button").textContent = "Home";
  document.title = "RePay | Unable to complete the transaction";
}


document.getElementById("return-button").addEventListener("click", (event) => {
  event.preventDefault();
  window.close();
  // WhatsApp's in-app browser closes on Back when a direct close is blocked.
  window.setTimeout(() => { if (history.length > 1) history.back(); }, 120);
});
