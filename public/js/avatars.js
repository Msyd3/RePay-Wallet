"use strict";
window.RePayAvatars = (() => {
 const names = ['01-man-casual','02-man-student','03-man-chef','04-man-designer','05-man-saudi','06-woman-casual','07-woman-glasses','08-woman-doctor','09-woman-architect','10-woman-hijab','11-man-military'];
 const presets = names.map((name,index) => ({ id: name, src: `assets/avatars/${name}.jpg`, label: `ميموجي ${index+1}` }));
 const fallback = key => {
  // Persist randomized defaults for this browser. Server avatarId is authoritative across devices.
  const storageKey = `repay-avatar-default:${key || 'anonymous'}`;
  try { const stored = localStorage.getItem(storageKey); if(names.includes(stored))return stored; } catch {}
  const random = new Uint32Array(1); crypto.getRandomValues(random);
  const id = names[random[0] % names.length];
  try { localStorage.setItem(storageKey,id); } catch {}
  return id;
 };
 const safeUrl = value => {
  if(typeof value !== 'string') return null;
  try { const url = new URL(value,location.origin); return url.origin === location.origin && url.pathname.startsWith('/api/avatars/') && !url.search && !url.hash ? url.href : null; } catch {return null;}
 };
 function source(person,own=false) {
  if(own && window.REPAY_CONFIG.demo) { try { const selected=localStorage.getItem('repay-demo-avatar'); if(names.includes(selected))return presets.find(p=>p.id===selected).src; if(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(selected) && selected.length<500000)return selected; }catch{} }
  return safeUrl(person?.avatarUrl) || presets.find(p=>p.id===person?.avatarId)?.src || presets.find(p=>p.id===fallback(person?.id || 'anonymous')).src;
 }
 function render(target,person,own=false) { const img=document.createElement('img');img.src=source(person,own);img.alt='';img.className='user-avatar-image';target.replaceChildren(img); }
 async function album(file) {
  if(!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024)throw Error('اختر صورة JPG أو PNG أو WebP بحجم أقل من 5 ميجابايت.');
  const bitmap=await createImageBitmap(file);
  if(bitmap.width*bitmap.height>20000000){bitmap.close();throw Error('أبعاد الصورة كبيرة جدًا.');}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const size=Math.min(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,512,512);bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));if(!blob)throw Error('تعذر قراءة الصورة.');return blob;
 }
 return { presets,source,render,album,safeUrl };
})();
