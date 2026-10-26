import {collectFeed,ARGOS_ORIGIN} from './oren-feed-model.mjs';
const status=document.getElementById('status'),send=document.getElementById('send'),download=document.getElementById('download');
const nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');
try {
 const feed=collectFeed(key=>localStorage.getItem(key));
 status.textContent=feed.items.length+' éléments disponibles sur cet appareil. OLYMPOS et PHÈMÉ ne disposent pas encore de connecteur.';
 send.disabled=!window.opener||!nonce;download.disabled=false;
 send.onclick=()=>{window.opener.postMessage({type:'oren:feed',nonce,feed},ARGOS_ORIGIN);status.textContent='Flux envoyé à ARGOS. Vérifie sa confirmation de réception.';};
 download.onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(feed)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='OREN-vers-ARGOS.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
} catch {status.textContent='Lecture locale impossible. Ouvre et synchronise MÉTIS dans ce navigateur avant de réessayer.';}

/* Automatic bridge: metadata only, restricted to the ARGOS parent window. */
window.addEventListener('message',e=>{
 if(e.origin!==ARGOS_ORIGIN||e.source!==window.parent||window.parent===window||e.data?.type!=='oren:feed:request'||typeof e.data.nonce!=='string'||e.data.nonce.length>100)return;
 try{
  if(!localStorage.getItem('metis-oren-v3-private')&&!localStorage.getItem('metis-v1-private')&&!localStorage.getItem('metis:tasks:v1'))throw Error('Synchronise MÉTIS dans ce navigateur avant la première alimentation.');
  const feed=collectFeed(key=>localStorage.getItem(key));
  e.source.postMessage({type:'oren:feed',nonce:e.data.nonce,feed},ARGOS_ORIGIN);
 }catch{e.source.postMessage({type:'oren:feed:error',nonce:e.data.nonce},ARGOS_ORIGIN)}
});
