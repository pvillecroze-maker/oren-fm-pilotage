/* ARGOS shared private reference: Google Drive app-owned file, no server-side contacts. */
const CLIENT='491091087228-lcc2u9hq27q8nt2pdgjueik6ru3cugma.apps.googleusercontent.com';
const FILE='ARGOS_OREN_LIVE_SHARED_V1.json';
const BASE='argos:drive:base-v1';
const BASE_ID='argos:drive:file-id-v1';
let token='',expiry=0,working=false,remote=null,remoteVersion='',remoteId='',applying=false,changed=false;
const box=document.createElement('section');
box.className='panel';box.style.margin='22px 0';
box.innerHTML='<h3>ARGOS · Référentiel privé partagé</h3><p class="sub">Synchronise les contacts et relations avec un fichier JSON privé créé dans ton Google Drive. Une fois autorisée, la synchronisation fonctionne à l’ouverture et pendant que cette page reste active. Les autres appareils doivent autoriser le même compte Google. Aucun jeton n’est enregistré.</p><button id="argosDriveConnect" type="button">Connecter Google Drive</button> <button id="argosDriveSync" type="button" disabled>Synchroniser maintenant</button> <button id="argosDrivePull" type="button" hidden>Charger la version Drive</button> <button id="argosDrivePush" type="button" hidden>Conserver la version locale</button> <button id="argosDriveDisconnect" type="button" disabled>Déconnecter</button><p id="argosDriveStatus" class="sub" role="status" aria-live="polite">Non connecté. Importe d’abord ta sauvegarde ARGOS pour rétablir la mémoire historique.</p><p class="sub">En cas de modifications concurrentes, le transfert s’arrête avant de remplacer les données. Exporte le réseau avant une résolution. Un fichier Drive commun peut aussi être consulté et modifié dans ChatGPT sur demande, mais la mémoire interne des conversations n’est pas synchronisée en temps réel.</p>';
(document.querySelector('.hero')||document.querySelector('main')).after(box);
const el=id=>document.getElementById(id),status=message=>el('argosDriveStatus').textContent=message;
function getSnapshot(){
 const value=window.argosGetNetworkSnapshot?.();
 if(!value||!Array.isArray(value.contacts)||!Array.isArray(value.relations))throw Error('Réseau ARGOS non prêt.');
 let metadata={};
 try{metadata=JSON.parse(localStorage.getItem('argos:metadata:v1')||'{}')}catch{}
 return {version:1,contacts:value.contacts,relations:value.relations,metadata};
}
function valid(d){
 if(!d||d.version!==1||!Array.isArray(d.contacts)||!Array.isArray(d.relations)||d.contacts.length>25000||d.relations.length>50000)throw Error('Sauvegarde privée distante non compatible.');
 if(d.contacts.some(c=>!c||typeof c!=='object'||Array.isArray(c)))throw Error('Contacts distants invalides.');
 return d;
}
async function hash(d){
 const bytes=new TextEncoder().encode(JSON.stringify(d));
 const dig=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function authenticated(){return token&&Date.now()<expiry}
async function request(url,options={}){
 if(!authenticated())throw Error('Session Google Drive expirée. Reconnecte-toi.');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);
 try{
  const res=await fetch(url,{...options,signal:ctrl.signal,cache:'no-store',headers:{Authorization:'Bearer '+token,...options.headers}});
  if(!res.ok){
   let reason='';
   try{const j=await res.clone().json();reason=j.error?.message||''}catch{}
   if(res.status===429)throw Error('Google Drive HTTP 429 : quota temporaire atteint. Réessaie plus tard, sauvegarde locale conservée.');
   if(res.status===401)throw Error('Autorisation Google expirée. Reconnecte ton compte.');
   if(res.status===403)throw Error('Google Drive HTTP 403 : autorisation drive.file ou API Drive à vérifier dans Google Cloud.');
   throw Error('Google Drive HTTP '+res.status+(reason?' : '+reason.slice(0,160):''));
  }
  return res;
 }finally{clearTimeout(timer)}
}
const api='https://www.googleapis.com/drive/v3/files';
async function lookup(){
 const q="name='"+FILE+"' and trashed=false";
 const url=api+'?spaces=drive&q='+encodeURIComponent(q)+'&fields=nextPageToken,files(id,name,version,modifiedTime)&pageSize=100';
 const result=await(await request(url)).json();
 if((result.files||[]).length>1||result.nextPageToken)throw Error('Plusieurs versions du référentiel détectées dans Drive : aucun écrasement automatique.');
 return result.files?.[0]||null;
}
async function fetchRemote(info){
 if(!info)return null;
 const r=await request(api+'/'+encodeURIComponent(info.id)+'?alt=media');
 const d=valid(await r.json());
 return d;
}
function baseline(fileId){return fileId===localStorage.getItem(BASE_ID)?localStorage.getItem(BASE)||'':''}
function remember(fileId,fingerprint){
 localStorage.setItem(BASE_ID,fileId);
 localStorage.setItem(BASE,fingerprint);
}
function conflictMessage(){
 el('argosDrivePull').hidden=false;el('argosDrivePush').hidden=false;
 status('Conflit : données locales et Drive différentes. Aucune version effacée. Exporte une sauvegarde ARGOS avant de choisir.');
}
function noConflict(){el('argosDrivePull').hidden=true;el('argosDrivePush').hidden=true;}
async function apply(d,info){
 applying=true;
 try{
  await window.argosApplyCloudSnapshot(valid(d));
  remember(info.id,await hash(d));
  remote=d;remoteId=info.id;remoteVersion=String(info.version||'');
  noConflict();status('Drive → ARGOS : '+d.contacts.length+' fiches, '+d.relations.length+' relations restaurées localement.');
 }finally{applying=false}
}
async function write(d,info){
 if(info){
  const latest=await(await request(api+'/'+encodeURIComponent(info.id)+'?fields=id,version,modifiedTime')).json();
  if(String(latest.version)!==String(info.version))throw Error('Le fichier Drive a changé pendant la sauvegarde : transfert arrêté pour éviter un écrasement.');
  const r=await request('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(info.id)+'?uploadType=media&fields=id,version,modifiedTime',{
   method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)
  });
  return r.json();
 }
 const boundary='argos_'+crypto.randomUUID();
 const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:FILE,mimeType:'application/json',description:'Référentiel privé ARGOS / OREN. Fichier créé par ARGOS et accessible via Google Drive.'})+'\r\n--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(d)+'\r\n--'+boundary+'--';
 const r=await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,version,modifiedTime',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 return r.json();
}
async function sync(forceLocal=false){
 if(working)return;
 if(!authenticated()){status('Connexion Drive nécessaire : clique sur Connecter Google Drive.');return}
 working=true;el('argosDriveSync').disabled=true;
 try{
  status('Comparaison du référentiel local et de Google Drive…');
  const local=getSnapshot(),localHash=await hash(local);
  const info=await lookup();
  if(!info){
   if(local.contacts.length===0){status('Aucune sauvegarde dans Drive ni contact local. Importe ta sauvegarde du 28 octobre avant de synchroniser.');return}
   const created=await write(local,null);
   remember(created.id,localHash);remote=local;remoteId=created.id;remoteVersion=String(created.version||'');noConflict();
   status('ARGOS → Drive : '+local.contacts.length+' fiches et '+local.relations.length+' relations dans ton référentiel privé.');
   return;
  }
  remoteId=info.id;remoteVersion=String(info.version||'');
  remote=await fetchRemote(info);
  const cloudHash=await hash(remote),base=baseline(info.id);
  if(cloudHash===localHash){remember(info.id,cloudHash);noConflict();status('ARGOS et Drive identiques · '+local.contacts.length+' fiches · '+local.relations.length+' relations.');return}
  if(forceLocal){
   const saved=await write(local,info);remember(info.id,localHash);remote=local;remoteVersion=String(saved.version||'');noConflict();
   status('Version locale envoyée à Drive après confirmation.');return;
  }
  if(!local.contacts.length||base===localHash){
   await apply(remote,info);
  }else if(base===cloudHash){
   const saved=await write(local,info);remember(info.id,localHash);remote=local;remoteVersion=String(saved.version||'');noConflict();
   status('ARGOS → Drive : modifications locales enregistrées.');
  }else{conflictMessage()}
 }catch(e){status('Sauvegarde privée : '+e.message)}
 finally{working=false;el('argosDriveSync').disabled=!authenticated();if(changed){changed=false;setTimeout(()=>sync(),1000)}}
}
let delay=null;
window.addEventListener('argos:local-change',()=>{
 if(applying||!authenticated())return;
 if(working){changed=true;return}
 clearTimeout(delay);delay=setTimeout(()=>sync(),3000);
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&authenticated())sync()});
setInterval(()=>{if(!document.hidden&&authenticated())sync()},90000);
el('argosDriveSync').onclick=()=>sync();
el('argosDrivePull').onclick=async()=>{
 if(!remoteId||!remote)return;
 if(!confirm('Charger la version Drive ? La version locale sera sauvegardée dans ce navigateur avant remplacement. Exporte ton réseau en sécurité avant de continuer.'))return;
 if(working)return;working=true;
 try{const info=await lookup();if(!info||info.id!==remoteId)throw Error('Fichier Drive modifié ou absent. Relance Synchroniser.');await apply(await fetchRemote(info),info)}
 catch(e){status(e.message)}finally{working=false}
};
el('argosDrivePush').onclick=()=>{
 if(!confirm('Remplacer le référentiel Drive par les données ARGOS de cet appareil ? Exporte une sauvegarde au préalable.'))return;
 sync(true);
};
el('argosDriveDisconnect').onclick=()=>{
 if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});
 token='';expiry=0;noConflict();el('argosDriveSync').disabled=true;el('argosDriveDisconnect').disabled=true;
 status('Drive déconnecté. Les fichiers et les données locales sont conservés.');
};
el('argosDriveConnect').onclick=()=>{
 if(!window.google?.accounts?.oauth2){status('Google Identity indisponible. Vérifie le réseau et recharge.');return}
 const client=google.accounts.oauth2.initTokenClient({
  client_id:CLIENT,scope:'https://www.googleapis.com/auth/drive.file',
  error_callback:()=>status('Autorisation Drive interrompue.'),
  callback:r=>{
   if(r.error||!r.access_token){status('Accès Google Drive refusé ou incomplet.');return}
   token=r.access_token;expiry=Date.now()+Number(r.expires_in||3500)*1000;
   el('argosDriveDisconnect').disabled=false;el('argosDriveSync').disabled=false;
   status('Compte connecté pour cette session. Recherche du référentiel partagé…');
   sync();
  }
 });
 client.requestAccessToken({prompt:'consent'});
};
