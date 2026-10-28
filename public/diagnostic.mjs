import {HOME,projects} from './oren-projects.mjs';
const root=document.getElementById('grid');
const button=document.getElementById('run');
function card(title,status,detail,ok){const el=document.createElement('article');el.className='card';const h=document.createElement('h2');h.textContent=title;const s=document.createElement('div');s.className='status'+(ok?' ok':'');s.textContent=status;const p=document.createElement('small');p.textContent=detail;el.append(h,s,p);root.append(el);}
async function exists(path,signature){try{const response=await fetch(path,{cache:'no-store',redirect:'error'});return response.ok&&new URL(response.url).origin===location.origin&&(await response.text()).includes(signature);}catch{return false;}}
async function run(){root.replaceChildren();button.disabled=true;try{
const official=location.origin===new URL(HOME).origin;
card('01 · Adresse',official?'JANUS CANONIQUE':'DOMAINE SECONDAIRE',location.origin,official);
const results=await Promise.all([exists('/metis/index.html','MÉTIS'),exists('/hermes.html','HERMÈS'),exists('/music/index.html','MÉTIS')]);
card('02 · Navigation',results.every(Boolean)?'3 ROUTES OK':'VÉRIFICATION REQUISE','MÉTIS / HERMÈS / APOLLON : '+results.map(v=>v?'OK':'indisponible').join(' · '),results.every(Boolean));
const bridge=await exists('/oren-feed-model.mjs','janus-oren-patrick-os.vercel.app');
card('03 · MÉTIS / ARGOS',bridge?'CONTRAT DISPONIBLE':'CONTRAT INDISPONIBLE','Réception de données à confirmer dans ARGOS. Aucun transfert effectué par ce diagnostic.',bridge);
const google=await exists('/metis/google-sync.js','Google');
card('04 · Google',google?'CODE DISPONIBLE':'MODULE INDISPONIBLE','Autorisation OAuth et lectures réelles Gmail/Agenda/Sheets à valider depuis MÉTIS.',google);
card('05 · Multiappareil','NON VALIDÉ','Un navigateur ne prouve pas une synchronisation entre iPhone et ordinateur. Vérifier la copie Google Drive.',false);
const external=projects.filter(p=>['anteros','pheme'].includes(p.id)&&p.url).length===2;
card('06 · ANTEROS / PHÈMÉ',external?'LIENS PRÉSENTS':'LIEN MANQUANT','Accès externes sans transfert automatique des fiches et données.',external);
const reg='serviceWorker' in navigator?await navigator.serviceWorker.getRegistration('/').catch(()=>null):null;
card('07 · PWA / hors ligne',reg?'SERVICE WORKER INSTALLÉ':'INSTALLATION À VÉRIFIER','Vérifier en mode avion après une première ouverture en ligne.',Boolean(reg));
card('08 · Sécurité','AUDIT SERVEUR DISTINCT','Cette page ne contrôle ni droits Google ni accès Vercel.',false);
}finally{button.disabled=false;}}
button.onclick=run;run();
