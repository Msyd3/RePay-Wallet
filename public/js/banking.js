"use strict";
window.RePayBanking = (() => {
 const normalize = value => RePay.digits(value).replace(/\s/g,'').toUpperCase();
 function validIban(value) {
  const iban=normalize(value);if(!/^SA\d{22}$/.test(iban))return false;
  const digits=iban.slice(4)+'2810'+iban.slice(2,4);let remainder=0;
  for(const digit of digits)remainder=(remainder*10+Number(digit))%97;
  return remainder===1;
 }
 const validHolder=value=>typeof value==='string' && value.trim().split(/\s+/).length>=2 && value.trim().length<=120;
 function logo(value){try{const url=new URL(value,location.origin);return url.origin===location.origin && (url.pathname.startsWith('/api/bank-logos/') || url.pathname.startsWith('/assets/banks/')) && !url.search && !url.hash ? url.href : 'assets/bank.svg';}catch{return 'assets/bank.svg';}}
 return {normalize,validIban,validHolder,logo};
})();
