"use strict";
const copy = {
  ar: {
    title:"قائمة الانتظار", intro:"تابع ترتيبك وشارك دعوتك لتتقدم في القائمة.", rank:"ترتيبك الحالي", rankNote:"سيظهر ترتيبك عند ربط حسابك بقائمة الانتظار.",
    rewards:"مكافآت الدعوات", rewardsCopy:"كل 10 دعوات مكتملة تضيف 10 ريالات إلى رصيدك بعد تفعيل التحويل.", progress:"تقدم الدعوات", waiting:"بانتظار ربط الدعوات",
username:"احجز اسم المستخدم", usernameCopy:"اسم مستخدم واحد لكل حساباتك وعملياتك المالية.", reserve:"حجز",
    leaders:"لوحة المتصدرين", leadersCopy:"يعرض المتصدرون بالبيانات المخفية لحماية الخصوصية.", leadersEmpty:"ستظهر القائمة عند تفعيل الدعوات.", nameColumn:"الاسم", numberColumn:"الرقم", rankColumn:"الترتيب"
  },
  en: {
    title:"Waitlist", intro:"Track your place and share your invite to move up.", rank:"Your current position", rankNote:"Your place will appear once your account is connected to the waitlist.",
    rewards:"Referral rewards", rewardsCopy:"Every 10 completed referrals adds SAR 10 to your balance after transfers are enabled.", progress:"Referral progress", waiting:"Waiting for referrals",
username:"Reserve your username", usernameCopy:"One username for all your accounts and financial activity.", reserve:"Reserve",
    leaders:"Leaderboard", leadersCopy:"Leaders are displayed with masked information for privacy.", leadersEmpty:"The leaderboard will appear when referrals are enabled.", nameColumn:"Name", numberColumn:"Number", rankColumn:"Rank"
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
$("username-title").textContent=t.username;$("username-copy").textContent=t.usernameCopy;$("username-save").textContent=t.reserve;
  $("leaders-title").textContent=t.leaders;$("leaders-copy").textContent=t.leadersCopy;$("leaders-name-column").textContent=t.nameColumn;$("leaders-number-column").textContent=t.numberColumn;$("leaders-rank-column").textContent=t.rankColumn;$("waitlist-leaders").replaceChildren(Object.assign(document.createElement("p"),{className:"waitlist-empty",textContent:t.leadersEmpty}));
  $("waitlist-language").textContent=language==="ar"?"EN":"عربي";
}
$("waitlist-language").addEventListener("click",()=>{language=language==="ar"?"en":"ar";localStorage.setItem("repay-language",language);render();});
render();