"use strict";
window.RePayAvatars = (() => {
 const colors=['blue','mint','pink','purple','yellow','peach','gray'];
 const emojis=['😊','😎','🥰','🤩','😄','🦁','🐈','🦋','🌸','🌴','☕','⚽','🎮','🚀','⭐','💙'];
 const arabicInitials={'ا':'A','أ':'A','إ':'A','آ':'A','ٱ':'A','ء':'A','ؤ':'W','ئ':'Y','ب':'B','ت':'T','ث':'T','ج':'J','ح':'H','خ':'K','د':'D','ذ':'D','ر':'R','ز':'Z','س':'S','ش':'S','ص':'S','ض':'D','ط':'T','ظ':'Z','ع':'A','غ':'G','ف':'F','ق':'Q','ك':'K','ک':'K','ل':'L','م':'M','ن':'N','ه':'H','ة':'H','و':'W','ي':'Y','ى':'Y','ی':'Y'};
 function initial(person){const name=person?.fullName||person?.displayName||person?.name||'';const letter=Array.from(name.normalize('NFKC')).find(letter=>/[\p{L}\p{N}]/u.test(letter));return arabicInitials[letter]||(/^[a-z]$/i.test(letter||'')?letter.toUpperCase():'A');}
 function normalize(value){return {kind:value?.kind==='emoji'&&emojis.includes(value.emoji)?'emoji':'initial',emoji:emojis.includes(value?.emoji)?value.emoji:emojis[0],color:colors.includes(value?.color)?value.color:'blue'};}
 function selection(person,own=false){
  if(own&&window.REPAY_CONFIG?.demo){try{const stored=localStorage.getItem('repay-demo-avatar-style');if(stored)return normalize(JSON.parse(stored));}catch{}}
  if(person?.avatar)return normalize(person.avatar);
  return normalize({kind:'initial',color:'blue'});
 }
 function render(target,person,own=false,override=null){
  const choice=override?normalize(override):selection(person,own);
  target.dataset.avatarColor=choice.kind==='emoji'?'emoji':choice.color;
  const content=document.createElement('span');content.className='avatar-character';
  content.textContent=choice.kind==='emoji'?choice.emoji:initial(person);
  content.lang=choice.kind==='emoji'?'':/[\u0600-\u06ff]/.test(content.textContent)?'ar':'en';
  content.setAttribute('aria-hidden','true');target.replaceChildren(content);
 }
 return {colors,emojis,initial,normalize,selection,render};
})();
