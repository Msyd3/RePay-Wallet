"use strict";
const copy = {
  ar: {
    title:"قائمة الانتظار", intro:"تابع ترتيبك وشارك دعوتك لتتقدم في القائمة.", rank:"ترتيبك الحالي", rankNote:"سيظهر ترتيبك عند ربط حسابك بقائمة الانتظار.",
    rewards:"مكافآت الدعوات", rewardsCopy:"كل ١٠ دعوات مكتملة تضيف ١٠ ريالات إلى رصيدك بعد تفعيل التحويل.", progress:"تقدم الدعوات", waiting:"بانتظار ربط الدعوات",
    share:"مشاركة رابط الدعوة", username:"احجز اسم المستخدم", usernameCopy:"اسم موحد تستقبل به التحويلات لاحقًا بدون مشاركة الآيبان.", reserve:"حجز",
    leaders:"لوحة المتصدرين", leadersCopy:"يعرض المتصدرون بالبيانات المخفية لحماية الخصوصية.", leadersEmpty:"ستظهر القائمة عند تفعيل الدعوات.", back:"العودة للرئيسية", shareUnavailable:"سيتم تفعيل رابط الدعوة قريبًا"
  },
  en: {
    title:"Waitlist", intro:"Track your place and share your invite to move up.", rank:"Your current position", rankNote:"Your place will appear once your account is connected to the waitlist.",
    rewards:"Referral rewards", rewardsCopy:"Every 10 completed referrals adds SAR 10 to your balance after transfers are enabled.", progress:"Referral progress", waiting:"Waiting for referrals",
    share:"Share invite link", username:"Reserve your username", usernameCopy:"One username to receive transfers later without sharing an IBAN.", reserve:"Reserve",
    leaders:"Leaderboard", leadersCopy:"Leaders are displayed with masked information for privacy.", leadersEmpty:"The leaderboard will appear when referrals are enabled.", back:"Back to home", shareUnavailable:"Your invite link will be enabled soon"
  }
};
let language=localStorage.getItem("repay-language")==="en"?"en":"ar";
const $=id=>document.getElementById(id);
function render(){
  const t=copy[language];
  document.documentElement.lang=language;document.documentElement.dir=language==="ar"?"rtl":"ltr";
  document.title="RePay | "+t.title;
  $("waitlist-title").textContent=t.title;$("waitlist-intro").textContent=t.intro;$("rank-title").textContent=t.rank;$("waitlist-rank-note").textContent=t.rankNote;
  $("rewards-title").textContent=t.rewards;$("rewards-copy").textContent=t.rewardsCopy;$("referral-progress").parentElement.setAttribute("aria-label",t.progress);$("referral-status").textContent=t.waiting;
  $("share-invite").textContent=t.share;$("username-title").textContent=t.username;$("username-copy").textContent=t.usernameCopy;$("username-save").textContent=t.reserve;
  $("leaders-title").textContent=t.leaders;$("leaders-copy").textContent=t.leadersCopy;$("waitlist-leaders").replaceChildren(Object.assign(document.createElement("p"),{className:"waitlist-empty",textContent:t.leadersEmpty}));
  document.querySelector(".waitlist-back").setAttribute("aria-label",t.back);
  $("waitlist-language").textContent=language==="ar"?"EN":"عربي";
}
$("waitlist-language").addEventListener("click",()=>{language=language==="ar"?"en":"ar";localStorage.setItem("repay-language",language);render();});
$("share-invite").addEventListener("click",()=>{});
render();