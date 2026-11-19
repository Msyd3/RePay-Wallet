"use strict";
window.RePayAvatars = (() => {
 const ids=Array.from({length:10},(_,i)=>`remoji-${String(i+1).padStart(2,'0')}`);
 const cache=new Map();
 function normalize(value){return {id:ids.includes(value?.id)?value.id:ids[0]};}
 function key(person){return `repay-avatar-v2:${person?.id||person?.userId||person?.phone||person?.email||person?.fullName||person?.displayName||person?.name||'guest'}`;}
 function save(person,value){const choice=normalize(value);cache.set(key(person),choice);try{localStorage.setItem(key(person),JSON.stringify(choice));localStorage.setItem("repay-avatar-current",JSON.stringify(choice));}catch{}return choice;}
 function phoneChoice(value){
  let phone=String(value||'').replace(/[٠-٩۰-۹]/g,d=>String(d.charCodeAt(0)-(d>="۰"?0x06F0:0x0660))).replace(/\D/g,'');
  if(/^05[0-9]{8}$/.test(phone))phone='966'+phone.slice(1);
  if(!/^9665[0-9]{8}$/.test(phone))return null;
  let hash=2166136261;
  for(const digit of phone)hash=Math.imul(hash^digit.charCodeAt(0),16777619);
  return {id:ids[(hash>>>0)%ids.length]};
 }
 function selection(person){
  if(ids.includes(person?.avatar?.id))return normalize(person.avatar);
  const identity=key(person);
  if(cache.has(identity))return cache.get(identity);
  try{const stored=JSON.parse(localStorage.getItem(identity));if(ids.includes(stored?.id)){cache.set(identity,normalize(stored));return cache.get(identity);}}catch{}
  const assigned=phoneChoice(person?.phone)||phoneChoice(person?.id);
  if(assigned)return save(person,assigned);
  const values=new Uint32Array(1);crypto.getRandomValues(values);
  return save(person,{id:ids[Math.floor(values[0]/4294967296*ids.length)]});
 }
 function current(){try{const stored=JSON.parse(localStorage.getItem("repay-avatar-current"));return ids.includes(stored?.id)?normalize(stored):null;}catch{return null;}}
 function render(target,person,own=false,override=null){
  const choice=override?normalize(override):selection(person);
  if(own){try{localStorage.setItem("repay-avatar-current",JSON.stringify(choice));}catch{}}
  delete target.dataset.avatarColor;target.classList.add('remoji-avatar');
  const image=document.createElement('img');image.className='remoji-image';image.src=`/assets/avatars/${choice.id}.svg?v=repay-shapes-1`;image.alt='';image.width=104;image.height=104;image.setAttribute('aria-hidden','true');target.replaceChildren(image);
 }
 return {ids,normalize,selection,save,current,render};
})();
