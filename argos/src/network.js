import './network.css';
import {personId,personName,makeGraph,validateRelation} from './network-model.js';

const RELATIONS='argos:relations:v1';
let contacts=[],relations=[],graph={nodes:[],edges:[]},selected=null,yaw=.35,pitch=.2,zoom=1,rotation=false,projected=[];
try{const saved=JSON.parse(localStorage.getItem(RELATIONS)||'[]');if(Array.isArray(saved))relations=saved}catch{}
const panel=document.createElement('section');panel.className='network';panel.id='network';
panel.innerHTML=`<div class="network-head"><div><span class="network-tag">ARGOS / CARTOGRAPHIE RELATIONNELLE</span><h2>Constellation 3D</h2></div><span class="network-tag" id="graphCount">0 PERSONNE</span></div>
<div class="network-tools"><input id="graphSearch" type="search" placeholder="Rechercher une personne…" aria-label="Rechercher dans le graphe"><button id="rotateGraph" aria-pressed="false">Rotation</button><button id="zoomIn" aria-label="Agrandir le graphe">＋</button><button id="zoomOut" aria-label="Réduire le graphe">−</button><button id="resetGraph">Recentrer</button><label><input id="showOrganizations" type="checkbox" checked> Organisations</label><select id="graphSelect" class="network-select" aria-label="Sélectionner une personne du graphe"><option value="">Choisir une personne</option></select></div>
<div class="network-stage"><div class="network-space"><canvas id="networkCanvas" tabindex="0" aria-label="Réseau 3D. Flèches pour tourner, plus et moins pour zoomer. Utilise la liste pour sélectionner une personne."></canvas><div class="network-overlay">GLISSER POUR TOURNER · TOUCHER POUR EXPLORER</div><div class="network-empty" id="graphEmpty"><strong>Ton réseau prend forme ici.</strong><p>Importe tes contacts ou connecte Google Contacts. Ajoute ensuite des relations sourcées pour dessiner ta cartographie.</p></div></div><aside class="network-detail" id="graphDetail"></aside></div>
<div class="network-legend"><span><b>●</b> Personne</span><span style="color:#d9bd83">◆ Organisation renseignée</span><span>Trait continu : relation documentée</span><span>Pointillé : lien à vérifier</span><span>Taille : nombre de relations documentées</span></div>
<details class="network-form"><summary>＋ Documenter une relation</summary><form id="relationForm"><div class="relation-fields"><label>De<select id="relationFrom" required></select></label><label>Vers<select id="relationTo" required></select></label><label>Nature du lien<select id="relationType"><option>Échange</option><option>Collaboration</option><option>Responsabilité</option><option>Influence déclarée</option><option>Autre</option></select></label><label>Statut<select id="relationStatus"><option value="documented">Documentée</option><option value="unverified">À vérifier</option></select></label><label class="wide">Source ou contexte<input id="relationSource" maxlength="500" placeholder="URL, réunion, échange daté…" required></label><label>Date de la relation<input id="relationDate" type="date"></label></div><p><button type="submit">Enregistrer le lien</button></p></form></details>
<p class="network-message" id="graphMessage" role="status">Les liens sont renseignés par toi. Une organisation commune ne prouve ni proximité ni influence. Aucune opinion ou affiliation n'est déduite.</p>`;
document.querySelector('.hero').after(panel);
const $=id=>document.getElementById(id),canvas=$('networkCanvas'),ctx=canvas.getContext('2d');
const element=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
function message(s){$('graphMessage').textContent=s}
function save(){try{localStorage.setItem(RELATIONS,JSON.stringify(relations));return true}catch{message('Stockage indisponible : exporte une sauvegarde pour conserver les liens.');return false}}
function options(id,items,placeholder){const s=$(id),previous=s.value;s.replaceChildren(new Option(placeholder,''),...items.map(n=>new Option(n.label,n.id)));if(items.some(n=>n.id===previous))s.value=previous}
function rebuild(){
 graph=makeGraph(contacts,relations,{query:$('graphSearch').value,organizations:$('showOrganizations').checked});
 const n=graph.nodes.length,golden=Math.PI*(3-Math.sqrt(5));
 graph.nodes.forEach((node,i)=>{const y=1-(i+.5)*2/Math.max(n,1),r=Math.sqrt(1-y*y),a=i*golden;node.pos=[Math.cos(a)*r,y,Math.sin(a)*r]});
 $('graphCount').textContent=graph.visible+' / '+graph.total+' PERSONNES';
 $('graphEmpty').hidden=!!graph.nodes.length;
 const people=graph.nodes.filter(n=>n.kind==='person');options('graphSelect',people,'Choisir une personne');
 const all=[...new Map(contacts.map(c=>[personId(c),{id:personId(c),label:personName(c)}])).values()].sort((a,b)=>a.label.localeCompare(b.label,'fr'));
 options('relationFrom',all,'Choisir une personne');options('relationTo',all,'Choisir une personne');
 if(selected&&!graph.nodes.some(n=>n.id===selected))selected=null;
 detail();draw();
}
function detail(){
 const root=$('graphDetail');root.replaceChildren();const n=graph.nodes.find(n=>n.id===selected);
 if(!n){root.append(element('small','LECTURE DU RÉSEAU'),element('h3','Des liens, des faits.'),element('p','Sélectionne un point pour voir la personne, ses relations et leurs sources.'),element('p','La taille indique la centralité dans les liens documentés ici. Ce n’est pas une mesure de pouvoir ou d’influence réelle.'),element('p','Jusqu’à 250 personnes affichées. Utilise la recherche pour explorer un grand annuaire.'));return}
 root.append(element('small',n.kind==='person'?'PERSONNE':'ORGANISATION'),element('h3',n.label));
 if(n.kind==='person'){
  const value=element('div',String(n.degree));value.className='metric';root.append(value,element('p','relation(s) documentée(s) dans la vue actuelle'));
  const b=element('button','Ouvrir la fiche');b.onclick=()=>window.dispatchEvent(new CustomEvent('argos:open-contact',{detail:n.contact}));root.append(b);
 }
 const adjacent=graph.edges.filter(e=>e.from===n.id||e.to===n.id);
 if(!adjacent.length)root.append(element('p','Aucune relation renseignée.'));
 for(const e of adjacent){const other=graph.nodes.find(x=>x.id===(e.from===n.id?e.to:e.from));const row=element('div','');row.className='relation-row';row.append(element('strong',(e.from===n.id?'→ ':'← ')+(other?.label||'')),element('p',e.type+' · '+(e.status==='documented'?'Documentée':e.status==='unverified'?'À vérifier':'Déclarée dans le contact')),element('p',e.source+(e.date?' · '+e.date:'')));
  if(e.kind==='relation'){const b=element('button','Retirer ce lien');b.onclick=()=>{relations=relations.filter(r=>r.id!==e.id);save();rebuild()};row.append(b)}root.append(row);
 }
}
function select(id){selected=id;$('graphSelect').value=id;detail();draw()}
function draw(){
 const rect=canvas.getBoundingClientRect();if(!rect.width)return;const dpr=Math.min(devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const cx=w/2,cy=h/2,scale=Math.min(w,h)*.32*zoom;
 ctx.strokeStyle='#33546944';ctx.lineWidth=1;for(let i=1;i<=3;i++){ctx.beginPath();ctx.ellipse(cx,cy,scale*i/3,scale*i/6,0,0,Math.PI*2);ctx.stroke()}
 projected=graph.nodes.map(n=>{const [x,y,z]=n.pos,a=x*Math.cos(yaw)+z*Math.sin(yaw),b=z*Math.cos(yaw)-x*Math.sin(yaw),yy=y*Math.cos(pitch)-b*Math.sin(pitch),zz=y*Math.sin(pitch)+b*Math.cos(pitch),f=3/(3-zz);return {...n,x:cx+a*scale*f,y:cy+yy*scale*f,z:zz,r:(n.kind==='organization'?7:5+Math.min(n.degree,12)*.7)*f}});
 const byId=new Map(projected.map(n=>[n.id,n])),neighbors=new Set([selected]);for(const e of graph.edges)if(e.from===selected||e.to===selected){neighbors.add(e.from);neighbors.add(e.to)}
 for(const e of graph.edges){const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;const active=e.from===selected||e.to===selected;ctx.globalAlpha=selected&&!active?.12:active?.95:.38;ctx.strokeStyle=e.kind==='organization'?'#d8bc81':'#80e8d4';ctx.lineWidth=active?1.8:1;ctx.setLineDash(e.status==='unverified'?[4,5]:e.kind==='organization'?[2,5]:[]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 ctx.setLineDash([]);ctx.globalAlpha=1;
 projected.sort((a,b)=>a.z-b.z).forEach(n=>{const active=n.id===selected;ctx.globalAlpha=selected&&!neighbors.has(n.id)?.3:Math.max(.4,(n.z+2)/3);ctx.fillStyle=n.kind==='organization'?'#d9bd83':'#8ce8d8';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=active?24:8;ctx.beginPath();if(n.kind==='organization'){ctx.moveTo(n.x,n.y-n.r);ctx.lineTo(n.x+n.r,n.y);ctx.lineTo(n.x,n.y+n.r);ctx.lineTo(n.x-n.r,n.y);ctx.closePath()}else ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;if(active){ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(n.x,n.y,n.r+5,0,Math.PI*2);ctx.stroke()}if(active||neighbors.has(n.id)||graph.nodes.length<35){ctx.font=(active?'600 ':'')+'11px system-ui';ctx.fillStyle='#d6e8ef';ctx.fillText(n.label.slice(0,30),n.x+n.r+7,n.y+4)}});ctx.globalAlpha=1;
}
let pointers=new Map(),dragged=false,pinch=0;
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);dragged=false;pinch=0};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const previous=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()],dist=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)zoom=Math.max(.4,Math.min(2.5,zoom*dist/pinch));pinch=dist;dragged=true}else{const dx=e.clientX-previous[0],dy=e.clientY-previous[1];if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;yaw+=dx*.008;pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*.008))}draw()};
canvas.onpointerup=e=>{pointers.delete(e.pointerId);if(!dragged){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=[...projected].reverse().find(n=>Math.hypot(n.x-x,n.y-y)<n.r+12);select(hit?.id||null)}pinch=0};canvas.onpointercancel=e=>pointers.delete(e.pointerId);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.4,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));draw()},{passive:false});
canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch-=.1;if(e.key==='ArrowDown')pitch+=.1;if(e.key==='+')zoom=Math.min(2.5,zoom+.1);if(e.key==='-')zoom=Math.max(.4,zoom-.1);draw()}};
let frame=null,last=0;function animate(t){if(!rotation)return;if(last)yaw+=Math.min(t-last,50)*.00015;last=t;draw();frame=requestAnimationFrame(animate)}
function stop(){rotation=false;last=0;cancelAnimationFrame(frame);$('rotateGraph').setAttribute('aria-pressed','false')}
$('rotateGraph').onclick=()=>{if(rotation)stop();else{rotation=true;last=0;$('rotateGraph').setAttribute('aria-pressed','true');frame=requestAnimationFrame(animate)}};document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
$('zoomIn').onclick=()=>{zoom=Math.min(2.5,zoom+.15);draw()};$('zoomOut').onclick=()=>{zoom=Math.max(.4,zoom-.15);draw()};$('resetGraph').onclick=()=>{yaw=.35;pitch=.2;zoom=1;select(null)};
$('graphSearch').oninput=rebuild;$('showOrganizations').onchange=rebuild;$('graphSelect').onchange=e=>select(e.target.value);
$('relationForm').onsubmit=e=>{e.preventDefault();try{const relation=validateRelation({id:crypto.randomUUID(),from:$('relationFrom').value,to:$('relationTo').value,type:$('relationType').value,status:$('relationStatus').value,source:$('relationSource').value,date:$('relationDate').value},contacts);if(relations.some(r=>r.from===relation.from&&r.to===relation.to&&r.type===relation.type)){message('Ce lien existe déjà.');return}relations.push(relation);const persisted=save();selected=relation.from;rebuild();$('relationSource').value='';if(persisted)message('Relation enregistrée sur cet appareil. Exporte une sauvegarde pour la transférer.')}catch(err){message(err.message)}};
window.addEventListener('argos:contacts',e=>{contacts=e.detail;rebuild()});
window.addEventListener('argos:export',()=>{const blob=new Blob([JSON.stringify({version:1,contacts,relations},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ARGOS-reseau-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
window.addEventListener('argos:restore-relations',e=>{const incoming=e.detail;if(!Array.isArray(incoming))return;let skipped=0;const map=new Map(relations.map(r=>[r.id,r]));for(const r of incoming){try{const valid=validateRelation(r,contacts);map.set(valid.id||crypto.randomUUID(),{...valid,id:valid.id||crypto.randomUUID()})}catch{skipped++}}relations=[...map.values()];save();rebuild();message('Sauvegarde importée : '+relations.length+' relations'+(skipped?' ; '+skipped+' liens invalides ignorés.':'.'))});
new ResizeObserver(draw).observe(canvas);rebuild();
