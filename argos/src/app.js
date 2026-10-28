import '../../public/oren-shell.mjs';
import './oren-feed.js';
import './network.js';
import './cloud-sync.js';
let contacts=[],cat='Tous';
/* Données privées : stockage local du navigateur uniquement, jamais GitHub/Vercel. */
const ARGOS_CACHE='argos:contacts:v2';
let contactsChanged=false;
function openArgosDb(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('IndexedDB indisponible'));const req=indexedDB.open('argos-private-v1',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('data'))req.result.createObjectStore('data')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function saveContacts(){
 contactsChanged=true;
 try{const db=await openArgosDb();await new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(contacts,'contacts');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();return true}
 catch(e){try{localStorage.setItem(ARGOS_CACHE,JSON.stringify(contacts));return true}catch{setSyncStatus('Stockage saturé ou indisponible. Exporte immédiatement une sauvegarde ARGOS JSON.');return false}}
}
async function restoreContacts(){
 try{const db=await openArgosDb();const saved=await new Promise((resolve,reject)=>{const tx=db.transaction('data','readonly'),req=tx.objectStore('data').get('contacts');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();if(!contactsChanged&&Array.isArray(saved)){contacts=saved;render();setSyncStatus(saved.length+' contacts restaurés sur cet appareil.');return}}
 catch(e){}
 try{const saved=JSON.parse(localStorage.getItem(ARGOS_CACHE)||'null');if(!contactsChanged&&Array.isArray(saved)){contacts=saved;render();setSyncStatus(saved.length+' contacts restaurés localement.')}}catch(e){}
}
const $=id=>document.getElementById(id);const cats=['Tous','POL','FD83','INST','PRO','MED','ASSO','RESEAU','PERSO','AUTRE'];function csv(t){let rows=[],row=[],v='',q=false;for(let i=0;i<t.length;i++){let c=t[i];if(q){if(c==='"'&&t[i+1]==='"'){v+='"';i++}else if(c==='"')q=false;else v+=c}else if(c==='"')q=true;else if(c===','){row.push(v);v=''}else if(c==='\n'){row.push(v.replace(/\r$/,''));rows.push(row);row=[];v=''}else v+=c}if(v||row.length){row.push(v);rows.push(row)}let keys=rows.shift()||[];return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]||''])))}const field=(c,...k)=>k.map(x=>c[x]).find(Boolean)||'';const name=c=>[c['First Name'],c['Last Name']].filter(Boolean).join(' ')||c['Organization Name']||'Sans nom';function node(tag,cls,txt){let n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}function appendContactLink(parent,label,url){if(!url)return;try{let u=new URL(url);if(!['https:','http:','mailto:','tel:'].includes(u.protocol))return;let a=node('a','',label);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';parent.append(a,node('p','',''))}catch{}}function show(c){let d=$('detail');d.replaceChildren(node('small','accent',field(c,'ARGOS - Catégorie')||'AUTRE'),node('h2','',name(c)),node('p','sub',field(c,'ARGOS - Profession','Organization Title','Organization Name')||'Profession non renseignée'),node('h3','','Résumé ARGOS'),node('p','',field(c,'ARGOS - Résumé')||'Profil à qualifier'),node('h3','','Coordonnées'));let mail=field(c,'ARGOS - Email principal','E-mail 1 - Value'),phone=field(c,'Phone 1 - Value');if(mail)appendContactLink(d,mail,'mailto:'+mail);if(phone)appendContactLink(d,phone,'tel:'+phone);d.append(node('p','',field(c,'ARGOS - Adresse principale','Address 1 - Formatted')));d.append(node('h3','','Réseaux'));appendContactLink(d,'Ouvrir le lien réseau ↗',field(c,'ARGOS - Lien réseau existant','ARGOS - Lien recherche LinkedIn'));d.append(node('small','sub','Un lien de recherche ne confirme pas une identité.'));$('profile').showModal()}function render(){window.dispatchEvent(new CustomEvent('argos:contacts',{detail:contacts}));let q=$('search').value.toLowerCase();let items=contacts.filter(c=>(cat==='Tous'||field(c,'ARGOS - Catégorie')===cat)&&[name(c),c['Organization Name'],c['ARGOS - Profession'],c['ARGOS - Résumé']].join(' ').toLowerCase().includes(q));$('count').textContent=contacts.length.toLocaleString('fr-FR');$('results').textContent=items.length.toLocaleString('fr-FR');let list=$('list');list.replaceChildren();if(!contacts.length){list.append(node('p','sub','Importe ton fichier ARGOS_contacts_profils_reseaux.csv pour commencer.'));return}for(let c of items.slice(0,250)){let b=node('button','card');b.append(node('b','',name(c)),node('small','sub',field(c,'ARGOS - Profession','Organization Title','Organization Name')||'À qualifier'),node('small','accent',field(c,'ARGOS - Catégorie')||'AUTRE'));b.onclick=()=>show(c);list.append(b)}if(items.length>250)list.append(node('p','sub','250 premiers résultats : affine ta recherche.'))}for(let c of cats){let b=node('button',c===cat?'on':'',c);b.onclick=()=>{cat=c;for(let x of $('filters').children)x.classList.toggle('on',x.textContent===cat);render()};$('filters').append(b)}$('search').oninput=render;$('close').onclick=()=>$('profile').close();$('file').onchange=async e=>{let f=e.target.files?.[0];if(!f)return;let data=csv(await f.text());if(!data.length||!('First Name'in data[0])){alert('CSV Google Contacts / ARGOS attendu');return}contacts=data;saveContacts();render();setSyncStatus(data.length+' contacts importés et conservés localement sur cet appareil.');};render();restoreContacts();
const GOOGLE_CLIENT_ID='491091087228-lcc2u9hq27q8nt2pdgjueik6ru3cugma.apps.googleusercontent.com';
const statusEl=$('syncStatus');
const setSyncStatus=msg=>{if(statusEl)statusEl.textContent=msg};
const PEOPLE_COOLDOWN_KEY='argos:people:retry-after';
let peopleBusy=false;
async function fetchPeoplePage(url,accessToken){
 const cooldown=Number(localStorage.getItem(PEOPLE_COOLDOWN_KEY)||0);
 if(Date.now()<cooldown){const minutes=Math.ceil((cooldown-Date.now())/60000);throw Error('Google People limite temporaire atteinte. Réessaie dans '+minutes+' min. Aucun contact local n’a été effacé.')}
 const response=await fetch(url,{headers:{Authorization:'Bearer '+accessToken},cache:'no-store'});
 if(response.status===429){
  const h=Number(response.headers.get('retry-after'));
  const delay=Number.isFinite(h)&&h>0?Math.min(3600,Math.max(60,h)):600;
  localStorage.setItem(PEOPLE_COOLDOWN_KEY,String(Date.now()+delay*1000));
  throw Error('Google People API HTTP 429 : quota dépassé. Nouvelle tentative possible dans '+Math.ceil(delay/60)+' min. Utilise le CSV ou le JSON ARGOS en attendant ; tes fiches restent préservées.');
 }
 if(!response.ok)throw Error('Google People API HTTP '+response.status+' : vérifie les autorisations et les quotas Google Cloud.');
 return response.json();
}
function mergeGoogleContacts(incoming){
 const result=contacts.map(c=>({...c}));
 const emails=new Map(),phones=new Map();
 const key=x=>String(x||'').trim().toLocaleLowerCase('fr');
 const phone=x=>String(x||'').replace(/[^0-9+]/g,'');
 for(let i=0;i<result.length;i++){
  const mail=key(result[i]['ARGOS - Email principal']||result[i]['E-mail 1 - Value']);if(mail)emails.set(mail,i);
  const number=phone(result[i]['Phone 1 - Value']);if(number&&number.length>=8)phones.set(number,i);
 }
 let added=0,enriched=0;
 for(const entry of incoming){
  const email=key(entry['ARGOS - Email principal']),number=phone(entry['Phone 1 - Value']);
  const match=email&&emails.has(email)?emails.get(email):number&&number.length>=8&&phones.has(number)?phones.get(number):-1;
  if(match>=0){
   const old=result[match];let updated=false;
   for(const [k,v] of Object.entries(entry)){if(v&&(!old[k]||old[k]==='Contact Google non qualifié dans ARGOS')){old[k]=v;updated=true}}
   if(updated)enriched++;
  }else{
   result.push(entry);const idx=result.length-1;if(email)emails.set(email,idx);if(number&&number.length>=8)phones.set(number,idx);added++;
  }
 }
 return {result,added,enriched};
}
$('googleContacts').onclick=()=>{
 if(peopleBusy){setSyncStatus('Lecture Google déjà en cours, attends son résultat.');return}
 if(!window.google?.accounts?.oauth2){setSyncStatus('Google Identity indisponible. Recharge la page.');return}
 const cooldown=Number(localStorage.getItem(PEOPLE_COOLDOWN_KEY)||0);
 if(Date.now()<cooldown){setSyncStatus('Google People API 429 : nouvelle tentative dans '+Math.ceil((cooldown-Date.now())/60000)+' min. Aucun contact supprimé.');return}
 const client=google.accounts.oauth2.initTokenClient({
  client_id:GOOGLE_CLIENT_ID,
  scope:'https://www.googleapis.com/auth/contacts.readonly',
  callback:async response=>{
   if(response.error||!response.access_token){setSyncStatus('Autorisation Google refusée ou indisponible.');return}
   if(peopleBusy)return;peopleBusy=true;$('googleContacts').disabled=true;
   try{
    setSyncStatus('Lecture sécurisée Google Contacts… données locales préservées.');
    const all=[];let next='',pages=0;
    do{
     const url='https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,addresses,photos,urls&pageSize=1000'+(next?'&pageToken='+encodeURIComponent(next):'');
     const data=await fetchPeoplePage(url,response.access_token);
     all.push(...(data.connections||[]));next=data.nextPageToken||'';
     if(++pages>100)throw Error('Pagination Google anormale : arrêt sans modification des contacts locaux.');
    }while(next);
    const incoming=all.map(p=>{
     const n=p.names?.[0]||{},org=p.organizations?.[0]||{},address=p.addresses?.[0]||{};
     return {'First Name':n.givenName||'','Last Name':n.familyName||'','Organization Name':org.name||'','Organization Title':org.title||'','ARGOS - Profession':org.title||'','ARGOS - Email principal':p.emailAddresses?.[0]?.value||'','Phone 1 - Value':p.phoneNumbers?.[0]?.value||'','ARGOS - Adresse principale':address.formattedValue||'','ARGOS - Photo URL':p.photos?.[0]?.url||'','ARGOS - Lien réseau existant':p.urls?.[0]?.value||'','ARGOS - Catégorie':'AUTRE','ARGOS - Résumé':'Contact Google non qualifié dans ARGOS'};
    });
    const merge=mergeGoogleContacts(incoming);
    if(!merge.added&&!merge.enriched){setSyncStatus('Google Contacts lu : aucune nouvelle fiche, mémoire ARGOS conservée.');return}
    contacts=merge.result;
    const saved=await saveContacts();if(!saved)throw Error('Sauvegarde locale indisponible. Exporte tes données ARGOS.');
    cat='Tous';render();window.dispatchEvent(new Event('argos:local-change'));
    setSyncStatus('Google Contacts : '+all.length+' contacts lus · '+merge.added+' ajoutés · '+merge.enriched+' enrichis. Catégories et fiches ARGOS conservées.');
   }catch(err){setSyncStatus('Synchronisation impossible : '+err.message)}
   finally{peopleBusy=false;$('googleContacts').disabled=false}
  }
 });
 client.requestAccessToken({prompt:'consent'});
};


/* JANUS : bilan agrégé, sans transmettre noms, adresses ou contacts. */
function publishJanusSummary(target,origin){
 if(!['https://metis-oren-patrick-os.vercel.app','https://janus-oren-patrick-os.vercel.app'].includes(origin))return;
 const categories={};
 for(const c of contacts){const key=String(c['ARGOS - Catégorie']||'AUTRE').slice(0,60);categories[key]=(categories[key]||0)+1}
 target.postMessage({type:'oren:argos:summary',version:1,at:new Date().toISOString(),count:contacts.length,categories},origin);
}
window.addEventListener('message',e=>{
 if(!['https://metis-oren-patrick-os.vercel.app','https://janus-oren-patrick-os.vercel.app'].includes(e.origin)||e.data?.type!=='oren:argos:request-summary')return;
 publishJanusSummary(e.source,e.origin);
});
/* Liaison locale et volontaire MÉTIS : ne partage que noms et catégories,
   exclusivement après une demande depuis la fiche ARGOS. */
window.addEventListener('message',e=>{
 if(!['https://metis-oren-patrick-os.vercel.app','https://janus-oren-patrick-os.vercel.app'].includes(e.origin)||e.data?.type!=='oren:argos:request-task-links'||!e.source)return;
 const names=contacts.slice(0,5000).map(c=>({
  name:name(c).slice(0,160),
  category:String(c['ARGOS - Catégorie']||'AUTRE').slice(0,80)
 })).filter(c=>c.name&&c.name!=='Sans nom');
 e.source.postMessage({type:'oren:argos:task-links',version:1,at:new Date().toISOString(),contacts:names,total:contacts.length},e.origin);
});
window.argosApplyCloudSnapshot=async data=>{
 if(data?.version!==1||!Array.isArray(data.contacts)||!Array.isArray(data.relations)||data.contacts.length>25000||data.relations.length>50000)throw Error('Référentiel ARGOS distant invalide.');
 if(data.contacts.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw Error('Contact distant invalide.');
 const before=window.argosGetNetworkSnapshot?.();
 if(before?.contacts?.length||before?.relations?.length){
  try{localStorage.setItem('argos:backup-before-cloud',JSON.stringify(before));}
  catch{throw Error('Sauvegarde locale avant remplacement impossible. Exporte ton réseau ARGOS et libère de l’espace.');}
 }
 const priorContacts=contacts;
 try{
  contacts=data.contacts.map(x=>({...x}));render();
  window.argosReplaceNetworkRelations(data.relations,{silent:true});
  if(!(await saveContacts()))throw Error('Sauvegarde des contacts impossible');
  if(data.metadata&&typeof data.metadata==='object')localStorage.setItem('argos:metadata:v1',JSON.stringify(data.metadata));
  setSyncStatus('Référentiel Drive chargé : '+contacts.length+' contacts conservés sur cet appareil.');
 }catch(e){
  contacts=priorContacts;render();
  if(before)window.argosReplaceNetworkRelations(before.relations,{silent:true});
  await saveContacts();throw e;
 }
};
window.addEventListener('argos:open-contact', e => show(e.detail));
$('exportNetwork').onclick=()=>window.dispatchEvent(new Event('argos:export'));
$('backupFile').onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{
  if(f.size>30000000)throw Error('Fichier supérieur à 30 Mo');
  const data=JSON.parse(await f.text());
  if(data.version!==1||!Array.isArray(data.contacts)||!Array.isArray(data.relations))throw Error('Format de sauvegarde ARGOS non reconnu');
  if(data.contacts.length>25000||data.relations.length>50000||data.contacts.some(c=>!c||typeof c!=='object'||Array.isArray(c)))throw Error('Format ou volume non autorisé.');
  const prior=window.argosGetNetworkSnapshot?.();
  if(prior?.contacts?.length){
   if(!confirm('Importer '+data.contacts.length+' fiches et '+data.relations.length+' relations ? Tes contacts actuels seront remplacés. Exporte ton réseau avant de continuer.'))return;
   try{localStorage.setItem('argos:backup-before-import',JSON.stringify(prior));}catch{throw Error('Sauvegarde de sécurité locale impossible. Utilise Exporter le réseau avant import.');}
  }
  contacts=data.contacts.map(c=>({...c}));render();
  window.dispatchEvent(new CustomEvent('argos:restore-relations',{detail:data.relations}));
  if(!(await saveContacts()))throw Error('Sauvegarde des contacts impossible');
  if(data.metadata&&typeof data.metadata==='object')localStorage.setItem('argos:metadata:v1',JSON.stringify(data.metadata));
  window.dispatchEvent(new Event('argos:local-change'));
  setSyncStatus('Import ARGOS : '+contacts.length+' fiches et relations restaurées. Référentiel local prêt pour la sauvegarde privée Drive.');
 }catch(err){alert('Import impossible : '+err.message)}
 e.target.value='';
};
