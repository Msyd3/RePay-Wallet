"use strict";
const expiredLanguage = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "ar";
document.documentElement.lang = expiredLanguage;
document.documentElement.dir = expiredLanguage === "ar" ? "rtl" : "ltr";
if (expiredLanguage === "en") {
  document.getElementById("result-message").textContent = "This link has expired";
  document.getElementById("expired-description").textContent = "Please start the transaction again.";
  document.getElementById("return-button").textContent = "Home";
  document.title = "RePay | This link has expired";
}
