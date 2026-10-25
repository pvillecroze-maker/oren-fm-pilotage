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
