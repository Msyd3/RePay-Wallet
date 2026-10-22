"use strict";
window.RePayAvatars = (() => {
 const ids=Array.from({length:10},(_,i)=>`remoji-${String(i+1).padStart(2,'0')}`);
 const cache=new Map();
 function normalize(value){return {id:ids.includes(value?.id)?value.id:ids[0]};}
 function key(person){return `repay-avatar-v2:${person?.id||person?.userId||person?.phone||person?.email||person?.fullName||person?.displayName||person?.name||'guest'}`;}
 function save(person,value){const choice=normalize(value);cache.set(key(person),choice);try{localStorage.setItem(key(person),JSON.stringify(choice));}catch{}return choice;}
 function selection(person){
  if(ids.includes(person?.avatar?.id))return normalize(person.avatar);
  const identity=key(person);
  if(cache.has(identity))return cache.get(identity);
  try{const stored=JSON.parse(localStorage.getItem(identity));if(ids.includes(stored?.id)){cache.set(identity,normalize(stored));return cache.get(identity);}}catch{}
  const values=new Uint32Array(1);crypto.getRandomValues(values);
  return save(person,{id:ids[Math.floor(values[0]/4294967296*ids.length)]});
 }
 function render(target,person,own=false,override=null){
  const choice=override?normalize(override):selection(person);
  delete target.dataset.avatarColor;target.classList.add('remoji-avatar');
  const image=document.createElement('img');image.className='remoji-image';const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;image.src=`assets/avatars/${choice.id}${reduced?'-still':''}.svg`;image.alt='';image.width=104;image.height=104;image.setAttribute('aria-hidden','true');target.replaceChildren(image);
 }
 return {ids,normalize,selection,save,render};
})();
