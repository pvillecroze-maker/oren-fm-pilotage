import {projectUrl} from '../../public/oren-projects.mjs';
import {METIS_ORIGIN,normalizeFeed,validReply} from '../../public/oren-feed-model.mjs';
const KEY='argos:oren-feed:v1';
let feed={items:[]},popup=null,nonce='',timer;
const panel=document.createElement('section');panel.className='panel';
panel.innerHTML='<h2>Activité des projets OREN</h2><p>MÉTIS : tâches, rendez-vous, sujets de courriels. HERMÈS : tâches ajoutées à MÉTIS. Alimentation automatique depuis MÉTIS dans ce navigateur, toutes les minutes tant qu’ARGOS est ouvert.</p><button id="orenSync">Synchroniser OREN</button> <label class="btn">Importer le flux JSON <input id="orenImport" type="file" accept="application/json" hidden></label> <button id="orenClear">Effacer ce flux local</button><p id="orenStatus" role="status"></p><p>OLYMPOS et PHÈMÉ : non raccordés. Aucun accès automatique à leurs données.</p><input id="orenSearch" placeholder="Rechercher une activité ou un projet" aria-label="Rechercher une activité ou un projet"><div id="orenItems"></div>';
document.querySelector('main').append(panel);
const el=id=>document.getElementById(id),status=s=>el('orenStatus').textContent=s;
const kinds={task:'Tâche',mail:'Courriel',event:'Rendez-vous'};
function render(){
 const q=el('orenSearch').value.toLocaleLowerCase('fr');const items=feed.items.filter(x=>[x.title,x.project,x.source].join(' ').toLocaleLowerCase('fr').includes(q));
 el('orenItems').replaceChildren();
 for(const item of items.slice(0,100)){const card=document.createElement('article');card.className='card';const title=document.createElement('strong');title.textContent=item.title;const meta=document.createElement('p');meta.textContent=[item.source,kinds[item.kind],item.project,item.date||'Date non renseignée',item.status].filter(Boolean).join(' · ');card.append(title,meta);if(item.url){const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Ouvrir la source';card.append(a);}if(item.project){const a=document.createElement('a');a.href=projectUrl(item.project);a.textContent=' · Actions du projet dans MÉTIS';card.append(a);}el('orenItems').append(card);}
 const count=document.createElement('p');count.textContent=items.length+' éléments correspondants'+(items.length>100?' · 100 affichés, affine la recherche.':'.');el('orenItems').prepend(count);
}
function accept(data){const next=normalizeFeed(data);localStorage.setItem(KEY,JSON.stringify(next));feed=next;render();status(feed.items.length+' éléments conservés sur cet appareil. Reçu le '+new Date().toLocaleString('fr-FR')+'. Instantané source : '+(feed.at||'date inconnue')+'.');}
try{const saved=localStorage.getItem(KEY);if(saved){feed=normalizeFeed(JSON.parse(saved));status('Dernier instantané source : '+(feed.at||'date inconnue'));}else status('Aucun flux importé. Synchronise MÉTIS puis clique sur Synchroniser OREN.');}catch{status('Lecture du flux local impossible ; réimporte une sauvegarde.');}
el('orenSearch').oninput=render;render();
el('orenSync').onclick=()=>{clearTimeout(timer);nonce=crypto.randomUUID();popup=window.open(METIS_ORIGIN+'/argos-feed.html#nonce='+nonce,'oren-argos-feed','popup,width=720,height=700');status(popup?'Dans la fenêtre MÉTIS, clique sur Transmettre à ARGOS.':'Fenêtre bloquée : autorise les fenêtres surgissantes, ou ouvre MÉTIS et importe son flux JSON.');timer=setTimeout(()=>{popup=null;nonce='';status('Transfert expiré après 5 minutes. Relance Synchroniser OREN ; les données précédentes sont conservées.');},300000);};
window.addEventListener('message',e=>{if(!validReply(e,popup,nonce))return;try{accept(e.data.feed);clearTimeout(timer);popup=null;nonce='';}catch{status('Flux refusé ou stockage saturé. Les données précédentes sont conservées.');}});
el('orenImport').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>20000000)throw Error();accept(JSON.parse(await f.text()));}catch{status('Import impossible : flux OREN invalide ou stockage saturé.');}e.target.value='';};
el('orenClear').onclick=()=>{if(confirm('Effacer uniquement le flux OREN local ? Les contacts et relations seront conservés.')){try{localStorage.removeItem(KEY);feed={items:[]};render();status('Flux local effacé.');}catch{status('Effacement impossible.');}}};

/* Continuous feed while visible; credentials and message bodies never cross origins. */
let bridge=null,bridgeNonce='',bridgeTimer;
function refreshAutomatic(){
 if(document.hidden)return;
 clearTimeout(bridgeTimer);bridgeNonce=crypto.randomUUID();
 const request=()=>{bridge.contentWindow.postMessage({type:'oren:feed:request',nonce:bridgeNonce},METIS_ORIGIN);
 bridgeTimer=setTimeout(()=>status('MÉTIS ne répond pas. Ouvre et synchronise MÉTIS dans ce navigateur. Dernier flux conservé.'),15000)};
 if(!bridge){bridge=document.createElement('iframe');bridge.hidden=true;bridge.title='Alimentation MÉTIS';bridge.src=METIS_ORIGIN+'/argos-feed.html';bridge.onload=request;document.body.append(bridge)}else request();
}
window.addEventListener('message',e=>{
 if(!bridge||e.origin!==METIS_ORIGIN||e.source!==bridge.contentWindow||e.data?.nonce!==bridgeNonce)return;
 if(e.data.type==='oren:feed:error'){clearTimeout(bridgeTimer);status('Aucune source MÉTIS lisible dans ce navigateur. Synchronise MÉTIS ; dernier flux conservé.');return}
 if(!validReply(e,bridge.contentWindow,bridgeNonce))return;
 clearTimeout(bridgeTimer);
 try{accept(e.data.feed)}catch{status('Flux automatique invalide ou stockage indisponible. Dernier flux conservé.')}
});
refreshAutomatic();
setInterval(refreshAutomatic,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAutomatic()});
