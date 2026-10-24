/* Mail bodies and OAuth tokens stay in memory. Only review metadata is saved locally. */
(()=>{
'use strict';
const CLIENT='491091087228-lcc2u9hq27q8nt2pdgjueik6ru3cugma.apps.googleusercontent.com';
const sessions=new Map(),coverage=new Map();let primaryPaused=false;
const panel=document.createElement('section');panel.className='settingscard';panel.style.margin='16px 20px';
panel.innerHTML='<h3>Courriels · toutes tes boîtes connectées · 30 jours</h3><p>Connecte pvillecroze puis emploi.pv. Chaque compte reste indépendant. Archives et envoyés inclus ; spam et corbeille exclus. Les corps des messages sont lus pour un préclassement par règles, à vérifier avant création d’une action. Les pièces jointes ne sont pas analysées.</p><div class="settingsbuttons"><button id="mail-connect" class="primary">Ajouter une boîte Gmail</button><button id="mail-refresh" class="secondary">Actualiser les boîtes</button><button id="mail-disconnect" class="secondary">Déconnecter les boîtes</button></div><p id="mail-coverage" role="status" aria-live="polite">Aucune boîte vérifiée dans cette session.</p>';
document.body.prepend(panel);
window.metisMailPanelUpdate=()=>{panel.hidden=!['mail','settings'].includes(state.tab);};window.metisMailPanelUpdate();
function report(){document.getElementById('mail-coverage').textContent=Array.from(coverage,([a,c])=>a+' : '+c).join(' · ')||'Aucune boîte connectée.';}
async function request(session,path){
 if(Date.now()>=session.expires)throw Error('Session expirée. Reconnecte cette boîte.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
 try{const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{signal:controller.signal,cache:'no-store',headers:{Authorization:'Bearer '+session.token}});if(!r.ok)throw Error('Gmail '+r.status+' : lecture interrompue, actualise ou reconnecte cette boîte.');return await r.json();}finally{clearTimeout(timer);}
}
function decoded(data){if(!data)return '';try{return new TextDecoder().decode(Uint8Array.from(atob(data.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)));}catch{return '';}}
function body(part){if(!part)return '';if(part.mimeType==='text/plain')return decoded(part.body?.data);const parts=part.parts||[];const plain=parts.filter(x=>x.mimeType==='text/plain');if(plain.length)return plain.map(body).join('\n');if(parts.length)return parts.map(body).join('\n');if(part.mimeType==='text/html')return decoded(part.body?.data).replace(/<[^>]*>/g,' ');return '';}
function classify(m){
 const text=(m.title+' '+m.text).toLocaleLowerCase('fr');
 if(m.labels.includes('SENT'))return {tag:'En attente / envoyé',reason:'Dernier message du fil envoyé par toi ; vérifier la réponse avant relance.'};
 if(m.labels.some(x=>['CATEGORY_PROMOTIONS','CATEGORY_SOCIAL'].includes(x))||/unsubscribe|désabonn|newsletter/.test(text))return {tag:'Q4 · Information',reason:'Diffusion ou notification probable ; aucune tâche créée automatiquement.'};
 const action=/merci de|pouvez-vous|peux-tu|veuillez|à compléter|a completer|à signer|confirmer|transmettre|retour attendu/.test(text);
 const important=/entretien|candidat|france travail|échéancier|ars|comredac|fédéral|fédérale|qomon|rade et la rose/.test(text);
 return {tag:action?(important?'Q2 · À examiner':'Q4 · À examiner'):'À examiner',reason:action?'Demande possible détectée. Importance proposée par mots-clés ; urgence et échéance à vérifier.':'Contexte à lire ; aucune action certaine déduite.',important};
}
async function scan(account,session,force=false){
 if(session.running)return session.running;
 if(!force&&session.last&&Date.now()-session.last<15*60000)return state.mails;
 session.running=(async()=>{
 const since=Math.floor((Date.now()-30*86400000)/1000),until=Math.floor(Date.now()/1000);
 coverage.set(account,'inventaire en cours…');report();
 try{
 let ids=[],next='';do{const page=await request(session,'messages?maxResults=500&q='+encodeURIComponent('after:'+since+' before:'+until+' -in:trash -in:spam')+(next?'&pageToken='+encodeURIComponent(next):''));ids.push(...(page.messages||[]));next=page.nextPageToken||'';coverage.set(account,ids.length+' messages recensés…');report();}while(next);
 ids=Array.from(new Map(ids.map(m=>[m.id,m])).values());
 const latest=new Map();let read=0,failures=0;
 // Bounded concurrency avoids saturating Gmail, and a failed read is never reported as complete.
 for(let i=0;i<ids.length;i+=5){await Promise.all(ids.slice(i,i+5).map(async ref=>{try{
 const m=await request(session,'messages/'+encodeURIComponent(ref.id)+'?format=full');
 async function hydrate(p){if(!p)return;if(/^text\/(plain|html)$/.test(p.mimeType)&&p.body?.attachmentId&&!p.body.data){const a=await request(session,'messages/'+encodeURIComponent(ref.id)+'/attachments/'+encodeURIComponent(p.body.attachmentId));p.body.data=a.data;}for(const child of p.parts||[])await hydrate(child);}await hydrate(m.payload);
 const headers=m.payload?.headers||[],get=n=>headers.find(h=>h.name.toLowerCase()===n)?.value||'';
 const item={id:account+':'+m.threadId,thread:m.threadId,account,title:get('subject')||'Sans objet',state:get('from'),date:Number(m.internalDate)||0,labels:m.labelIds||[],text:body(m.payload),url:'https://mail.google.com/mail/u/?authuser='+encodeURIComponent(account)+'#all/'+m.threadId};
 if(!/mailsuite|mailtrack/i.test(item.state)){if(!latest.has(m.threadId)||latest.get(m.threadId).date<item.date)latest.set(m.threadId,item);}read++;
 }catch{failures++;}}));coverage.set(account,read+'/'+ids.length+' corps lus'+(failures?' · '+failures+' échecs':''));report();}
 if(failures){throw Error(read+'/'+ids.length+' lus, '+failures+' échecs. Ancienne liste conservée ; relance Actualiser.');}
 const mails=Array.from(latest.values()).map(m=>{const result={...m,...classify(m)};delete result.text;delete result.labels;return result;});
 state.mails=[...state.mails.filter(m=>m.account&&m.account!==account),...mails].sort((a,b)=>(b.date||0)-(a.date||0));save();session.last=Date.now();
 coverage.set(account,read+'/'+ids.length+' corps lus · '+mails.length+' fils · '+new Date().toLocaleTimeString('fr-FR')+' · préclassement à vérifier');report();return state.mails;
 }catch(e){coverage.set(account,e.message);report();throw e;}
 })();try{return await session.running;}finally{session.running=null;}
}
async function register(token,expires,force){const s={token,expires},p=await request(s,'profile'),account=p.emailAddress;if(!account)throw Error('Compte Gmail non identifié.');const old=sessions.get(account);if(old){old.token=token;old.expires=expires;}else sessions.set(account,s);return scan(account,sessions.get(account),force);}
window.metisEnableMails=()=>{primaryPaused=false;};
window.metisScanPrimary=(token,expires)=>primaryPaused?Promise.resolve(state.mails):register(token,expires,false);
document.getElementById('mail-connect').onclick=()=>{if(!window.google?.accounts?.oauth2){coverage.set('Connexion','Google indisponible. Réessaie dans Safari.');report();return;}google.accounts.oauth2.initTokenClient({client_id:localStorage.getItem('metis-google-client-id')||CLIENT,scope:'https://www.googleapis.com/auth/gmail.readonly',error_callback:()=>{coverage.set('Connexion','Connexion interrompue.');report();},callback:async r=>{if(r.error){coverage.set('Connexion','Autorisation refusée.');report();return;}try{await register(r.access_token,Date.now()+Number(r.expires_in)*1000,true);}catch(e){coverage.set('Connexion',e.message);report();}}}).requestAccessToken({prompt:'select_account'});};
document.getElementById('mail-refresh').onclick=async()=>{for(const [a,s] of sessions){try{await scan(a,s,true);}catch{}}if(!sessions.size){coverage.set('Connexion','Ajoute une boîte Gmail pour démarrer.');report();}};
document.getElementById('mail-disconnect').onclick=()=>{if(Array.from(sessions.values()).some(s=>s.running)){alert('Attends la fin de la lecture avant de déconnecter.');return;}primaryPaused=true;sessions.clear();coverage.clear();report();};
document.addEventListener('click',async e=>{const button=e.target.closest('[data-mail-task]');if(!button)return;const m=state.mails.find(x=>x.id===button.dataset.mailTask);if(!m)return;
 const title=prompt('Action explicite à réaliser (vérifie le dernier échange dans Gmail) :','Examiner : '+m.title);if(!title?.trim())return;
 const q=prompt('Quadrant : Q1 important urgent, Q2 important non urgent, Q3 peu important urgent, Q4 peu important non urgent.',m.important?'Q2':'Q4')?.toUpperCase();if(!['Q1','Q2','Q3','Q4'].includes(q))return;
 button.disabled=true;try{if(!window.metisAppendMailTask)throw Error('Connecte Google pour enregistrer dans la matrice.');await window.metisAppendMailTask({title:title.trim(),mail:m.url,account:m.account,project:'Courriels',important:q==='Q1'||q==='Q2',urgent:q==='Q1'||q==='Q3',details:'Source : '+m.account+' · '+m.title+'. Action et quadrant validés manuellement. Échéance non renseignée.'});alert('Action enregistrée dans Sheets et chargée dans la matrice.');}catch(err){alert(err.message);}finally{button.disabled=false;}
});
})();
