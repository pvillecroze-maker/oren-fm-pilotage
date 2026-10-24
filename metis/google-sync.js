/* Google credentials stay in memory. Private data never enters deployment files. */
(()=>{
const SCOPES='https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/spreadsheets';
const CFG='metis-google-client-id';
const DEFAULT_CLIENT='491091087228-lcc2u9hq27q8nt2pdgjueik6ru3cugma.apps.googleusercontent.com';
const SHEET_ID='1NCfTpjGG9eSvzXNCNZuQBAcwjN93X5dBVIr0JttoDPs';
window.metisGoogleConnected=()=>Boolean(token&&Date.now()<expires);
let token='',expires=0,busy=false,etag=null,fileId=null,base=null;
let message='Google non connecté. Configuration requise.',last=localStorage.getItem('metis-last-sync');
const payload=()=>({tasks:state.tasks,events:state.events,mails:state.mails,snapshot:state.snapshot,updated:state.updated,version:4});
const fingerprint=()=>JSON.stringify(payload());
function status(s){message=s;const el=document.getElementById('google-status');if(el)el.textContent=s+(last?' · Dernière synchronisation : '+new Date(last).toLocaleString('fr-FR'):'');}
const card=document.createElement('section');card.className='settingscard';card.style.margin='16px 20px';card.innerHTML='<h3>Google · Synchronisation privée</h3><p id="google-status" role="status" aria-live="polite"></p><div class="settingsbuttons"><button class="primary" id="google-connect">Connecter Google</button><button class="secondary" id="google-sync">Actualiser</button><button class="secondary" id="google-disconnect">Déconnecter</button></div><details><summary>Configurer Google</summary><p>Identifiant OAuth public de type application Web. Autoriser cette origine : <code id="google-origin"></code>. Activer les API Gmail, Calendar, Drive et Google Sheets dans ce projet Google.</p><label>Identifiant client Google <input id="google-client" placeholder="…apps.googleusercontent.com" autocomplete="off"></label><button id="google-config">Enregistrer la configuration</button></details><p>Agenda du jour et 30 courriels récents non archivés. Courriels présentés comme éléments à examiner ; aucune tâche créée sans validation. Les statuts des tâches sont enregistrés dans Google Sheets après confirmation. Une copie des données est conservée dans ton espace applicatif Google Drive. Aucun courriel envoyé, aucun rendez-vous modifié.</p>';
document.body.prepend(card);document.getElementById('google-origin').textContent=location.origin;document.getElementById('google-client').value=localStorage.getItem(CFG)||DEFAULT_CLIENT;status(message);
function endpoint(path){
 if(path.startsWith('sheets/'))return {url:'https://sheets.googleapis.com/'+path.slice(7),service:'Google Sheets'};
 if(path.startsWith('gmail/'))return {url:'https://gmail.googleapis.com/'+path,service:'Gmail'};
 return {url:'https://www.googleapis.com/'+path,service:path.startsWith('calendar/')?'Google Agenda':'Google Drive'};
}
async function api(path,opts={}){
 if(!token||Date.now()>=expires)throw Error('Session Google expirée : touche Connecter Google.');
 const {url,service}=endpoint(path);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 let r;
 try{r=await fetch(url,{...opts,signal:controller.signal,cache:'no-store',headers:{Authorization:'Bearer '+token,...opts.headers}});}
 catch(e){const write=opts.method&&opts.method!=='GET';throw Error(service+' : '+(e.name==='AbortError'?'délai de réponse dépassé.':'connexion réseau impossible.')+(write?' Enregistrement non confirmé : actualise avant de réessayer.':' Réessaie avec Actualiser. Si le problème persiste, ouvre MÉTIS dans Safari.'));}
 finally{clearTimeout(timeout);}
 if(!r.ok){
  if(r.status===401){token='';render();throw Error(service+' : session expirée, reconnecte Google.');}
  if(r.status===412)throw Error(service+' : modification sur un autre appareil. Actualise avant de reprendre.');
  let code='';try{const detail=await r.json();code=detail.error?.details?.find(d=>d.reason)?.reason||detail.error?.status||'';}catch(e){}
  const help=code==='SERVICE_DISABLED'?'Active cette API dans le projet Google Cloud.':r.status===403?'Vérifie les autorisations Google et les API activées.':r.status===404?'Vérifie que le compte connecté a accès au fichier.':'Réessaie dans quelques instants.';
  throw Error(service+' : erreur '+r.status+(code?' ('+code+')':'')+'. '+help);
 }
 return r;
}
async function paged(path){let items=[],next='';do{const data=await(await api(path+(next?'&pageToken='+encodeURIComponent(next):''))).json();items.push(...(data.items||[]));next=data.nextPageToken||'';}while(next);return items;}
async function cloud(){const list=await(await api("drive/v3/files?spaces=appDataFolder&q="+encodeURIComponent("name='metis-state-v4.json' and trashed=false")+'&fields=files(id)&pageSize=100')).json();if(list.files.length>1)throw Error('Plusieurs sauvegardes Google détectées. Synchronisation arrêtée pour protéger tes données.');fileId=list.files[0]?.id||null;if(!fileId)return null;const r=await api('drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media');etag=r.headers.get('etag');const data=await r.json();if(!Array.isArray(data.tasks)||!Array.isArray(data.events)||!Array.isArray(data.mails))throw Error('Sauvegarde distante invalide : copie locale conservée.');return data;}
function apply(data){Object.assign(state,{tasks:data.tasks,events:data.events,mails:data.mails,snapshot:data.snapshot,updated:data.updated});localStorage.setItem(STORE,JSON.stringify(payload()));render();}
async function sync(){if(busy)return;busy=true;status('MÉTIS 4.3 · Lecture Google Drive…');try{
let driveReady=true;const warnings=[];let remote=null;
const before=fingerprint();try{remote=await cloud();}catch(e){driveReady=false;warnings.push(e.message);} if(fingerprint()!==before)throw Error('Une modification locale est en cours. Relance Actualiser.');
if(remote){const remotePrint=JSON.stringify(remote);if(base===null){if(state.tasks.length&&before!==remotePrint){if(!confirm('Une sauvegarde existe sur Google Drive. Charger cette version ? Ta copie locale sera sauvegardée sur cet appareil avant remplacement.'))throw Error('Synchronisation annulée : aucune donnée remplacée.');localStorage.setItem('metis-backup-before-sync',before);}apply(remote);}else if(remotePrint!==base&&before!==base){throw Error('Conflit entre appareils. Exporte ta copie locale puis reconnecte Google pour choisir la version distante.');}else if(remotePrint!==base){apply(remote);}}
status('MÉTIS 4.3 · Lecture Google Sheets…');
const taskCount=await refreshSheetStatuses();
const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);
status('MÉTIS 4.3 · Lecture Google Agenda…');
const ev=await paged('calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin='+encodeURIComponent(start.toISOString())+'&timeMax='+encodeURIComponent(end.toISOString())+'&maxResults=250');
status('MÉTIS 4.3 · Lecture Gmail…');
const ml=await(await api('gmail/v1/users/me/messages?maxResults=30&q='+encodeURIComponent('in:inbox newer_than:14d'))).json();
const mails=[];for(const m of ml.messages||[]){const d=await(await api('gmail/v1/users/me/messages/'+encodeURIComponent(m.id)+'?format=metadata&metadataHeaders=Subject&metadataHeaders=From')).json();mails.push({id:m.id,title:d.payload?.headers?.find(h=>h.name.toLowerCase()==='subject')?.value||'Sans objet',tag:'À examiner',state:d.payload?.headers?.find(h=>h.name.toLowerCase()==='from')?.value||'',url:'https://mail.google.com/mail/u/0/#all/'+m.id});}
state.events=ev.filter(e=>e.status!=='cancelled').map(e=>({id:e.id,title:e.summary||'Sans titre',time:e.start.dateTime?new Date(e.start.dateTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'Journée',end:e.end.dateTime?new Date(e.end.dateTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'',tag:'Google Agenda',url:e.htmlLink,protected:false,conflict:false}));state.mails=mails;state.snapshot=new Date().toISOString();save();
status('MÉTIS 4.3 · Sauvegarde Google Drive…');
const data=JSON.stringify(payload());if(driveReady){if(fileId){if(!etag)throw Error('Google ne fournit pas de contrôle de version : écriture distante suspendue.');await api('upload/drive/v3/files/'+encodeURIComponent(fileId)+'?uploadType=media',{method:'PATCH',headers:{'Content-Type':'application/json','If-Match':etag},body:data});}else{const boundary='metis_'+crypto.randomUUID();await api('upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:'--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify({name:'metis-state-v4.json',parents:['appDataFolder']})+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+data+'\r\n--'+boundary+'--'});}base=data;}last=new Date().toISOString();localStorage.setItem('metis-last-sync',last);status(taskCount+' tâches chargées depuis Sheets · '+ev.length+' événements · '+mails.length+' courriels'+(warnings.length?' · Sauvegarde Drive indisponible : '+warnings.join(' ; '):''));
}catch(e){status(e.message);}finally{busy=false;}}
function sheetTasks(values){
 const head=(values[0]||[]).map(x=>String(x||'').trim());
 const required=['ACTION EXPLICITE','PROJET','STATUT (modifier)','IMPORTANT','URGENT'];
 if(required.some(h=>!head.includes(h)))throw Error('Google Sheets : colonnes de la matrice non reconnues.');
 const val=(r,k)=>String(r[head.indexOf(k)]??'').trim();
 const counts=new Map();for(const row of values.slice(1)){const title=val(row,'ACTION EXPLICITE');if(title)counts.set(title,(counts.get(title)||0)+1);}
 return values.slice(1).flatMap((row,i)=>{
  const title=val(row,'ACTION EXPLICITE');if(!title)return [];
  const prior=state.tasks.filter(t=>t.title.trim()===title);
  const old=prior.length===1&&counts.get(title)===1?prior[0]:null;
  const dueText=val(row,'ÉCHÉANCE');
  const number=k=>Math.max(0,Number(val(row,k).replace(',','.'))||0);
  return [{...old,id:old?.id||'sheet-'+SHEET_ID+'-'+(i+2),title,project:val(row,'PROJET')||'À classer',status:val(row,'STATUT (modifier)')||'À faire',important:val(row,'IMPORTANT').toLowerCase()==='oui',urgent:val(row,'URGENT').toLowerCase()==='oui',due:csvDate(dueText),dueText,estimate:number('PRÉVU (min)'),actual:number('RÉEL (min)'),owner:val(row,'RESPONSABLE'),details:val(row,'NOTE / DÉCISION'),mail:safeLink(val(row,'MAIL'))||old?.mail||'',calendar:safeLink(val(row,'AGENDA'))||old?.calendar||'',kind:old?.kind||'work',sheetSource:SHEET_ID,sheetRow:i+2}];
 });
}
async function refreshSheetStatuses(){
 const before=JSON.stringify(state.tasks);
 const result=await(await api('sheets/v4/spreadsheets/'+SHEET_ID+'/values/'+encodeURIComponent("'MATRICE MOBILE'!A1:Q1000"))).json();
 if(JSON.stringify(state.tasks)!==before)throw Error('Tâches modifiées pendant la lecture : relance Actualiser.');
 const imported=sheetTasks(result.values||[]);
 const titles=new Set(imported.map(t=>t.title));
 // Conserver les tâches locales absentes du classeur et leurs chronomètres.
 state.tasks=[...imported,...state.tasks.filter(t=>!titles.has(t.title.trim()))];
 save();
 return imported.length;
}
// Écriture ciblée dans le classeur MÉTIS. Refuse les titres absents/dupliqués et les conflits de statut.
async function updateTaskStatus(task, previous){
 if(!token||Date.now()>=expires)throw Error('Connecte Google dans Réglages avant de valider une tâche.');
 const id=SHEET_ID;
 const sheet="'MATRICE MOBILE'";
 const result=await(await api('sheets/v4/spreadsheets/'+id+'/values/'+encodeURIComponent(sheet+'!B2:D1000'))).json();
 const matches=[];
 for(let i=0;i<(result.values||[]).length;i++)if(String(result.values[i][0]||'').trim()===task.title.trim())matches.push({row:i+2,status:String(result.values[i][2]||'').trim()});
 if(matches.length!==1)throw Error(matches.length?'Titre dupliqué dans Sheets : enregistrement annulé.':'Tâche absente de Sheets : enregistrement annulé.');
 const current=matches[0];
 if(current.status!==previous)throw Error('Conflit de statut avec Google Sheets ('+current.status+'). Recharge avant de modifier.');
 const target=sheet+'!D'+current.row;
 await api('sheets/v4/spreadsheets/'+id+'/values/'+encodeURIComponent(target)+'?valueInputOption=RAW',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({range:target,majorDimension:'ROWS',values:[[task.status]]})});
 const verify=await(await api('sheets/v4/spreadsheets/'+id+'/values/'+encodeURIComponent(target))).json();
 if(verify.values?.[0]?.[0]!==task.status)throw Error('Écriture non confirmée dans Google Sheets.');
 status('Statut enregistré dans Google Sheets : '+task.title);
 return true;
};
window.metisUpdateTaskStatus=async function(task,previous){
 if(busy)throw Error('Synchronisation en cours : réessaie dans quelques instants.');
 busy=true;try{return await updateTaskStatus(task,previous);}finally{busy=false;}
};
document.getElementById('google-config').onclick=()=>{const id=document.getElementById('google-client').value.trim();if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(id)){status('Identifiant client Google invalide.');return;}localStorage.setItem(CFG,id);status('Configuration enregistrée. Touche Connecter Google.');};
document.getElementById('google-connect').onclick=()=>{const id=localStorage.getItem(CFG)||DEFAULT_CLIENT;if(!id){status('Connexion indisponible : il manque l’identifiant OAuth Google du projet. Ouvre Configurer Google.');return;}if(!window.google?.accounts?.oauth2){status('Chargement Google indisponible. Vérifie ta connexion et réessaie.');return;}google.accounts.oauth2.initTokenClient({client_id:id,scope:SCOPES,error_callback:()=>status('Connexion Google interrompue. Réessaie.'),callback:r=>{if(r.error){status('Autorisation Google refusée : '+r.error);return;}if(!google.accounts.oauth2.hasGrantedAllScopes(r,...SCOPES.split(' '))){status('Autorisations incomplètes. Reconnecte Google pour autoriser Agenda, Gmail et la sauvegarde.');return;}token=r.access_token;expires=Date.now()+Number(r.expires_in)*1000;base=null;sync();}}).requestAccessToken({prompt:'select_account'});};
document.getElementById('google-sync').onclick=sync;document.getElementById('google-disconnect').onclick=()=>{if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});token='';expires=0;base=null;status('Google déconnecté. Copie locale conservée.');render();};
setInterval(()=>{if(token&&Date.now()<expires&&!document.hidden)sync();},60000);
})();
