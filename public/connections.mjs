import {projects,projectUrl} from './oren-projects.mjs';
import {spaces,projectStructure} from './olympos-structure.mjs';

const container=document.getElementById('projects');
const documented=new Set(['athena','calliope','rade-rose','hestia','hygie','hypnos','harmonia','mnemosyne']);
const visible=projects.filter(p=>p.id!=='janus'&&!p.legacy);
const legacy=projects.filter(p=>p.legacy);
const allIds=new Set(projects.map(p=>p.id));
if(allIds.size!==projects.length)throw Error('Catalogue JANUS : identifiants projet en double.');

function link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;
 if(url.startsWith('https://')&&!url.startsWith(location.origin)){a.target='_blank';a.rel='noopener noreferrer'}
 return a}
for(const space of [...spaces].sort((a,b)=>Number(a.id)-Number(b.id))){
 const items=visible.filter(p=>projectStructure[p.id]?.spaceId===space.id);
 if(!items.length)continue;
 const section=document.createElement('section'),heading=document.createElement('h2'),grid=document.createElement('div');
 heading.textContent=space.name;grid.className='grid';
 section.append(heading,link('Dossier Drive de ce domaine',space.driveUrl));
 for(const p of items){
  const info=projectStructure[p.id],card=document.createElement('article');
  const title=document.createElement('h3'),description=document.createElement('p'),state=document.createElement('p'),type=document.createElement('small');
  title.textContent=p.name;description.textContent=p.detail;
  type.textContent=documented.has(p.id)?'Dossier ou document':'Application ou outil';
  state.textContent=info.connection;state.className='connection-status';
  card.append(type,title,description,state,link(documented.has(p.id)?'Ouvrir le document':'Ouvrir l’application',p.url),link('Dossier de référence',info.driveUrl),link('Actions dans MÉTIS',projectUrl(p.name)));
  grid.append(card);
 }
 section.append(grid);container.append(section);
}
if(legacy.length){
 const details=document.createElement('details'),summary=document.createElement('summary');
 summary.textContent='Anciens portails — accès conservés (ne pas utiliser comme entrée principale)';
 details.append(summary);
 for(const p of legacy){const info=projectStructure[p.id];const item=document.createElement('p');item.append(link(p.name,p.url),document.createTextNode(' · accès historique conservé ; aucune suppression de données.'));
  if(info?.driveUrl)item.append(link('Dossier de référence',info.driveUrl));
  details.append(item)}
 container.append(details);
}
function refresh(){
 const status=document.getElementById('local');
 try{
  const raw=localStorage.getItem('metis-oren-v3-private')||localStorage.getItem('metis-v1-private');
  const data=raw?JSON.parse(raw):null,sync=localStorage.getItem('metis-last-sync');
  const timestamp=sync&&Number.isFinite(Date.parse(sync))?new Date(sync).toLocaleString('fr-FR'):'aucune date disponible';
  status.textContent=(data?`${Array.isArray(data.tasks)?data.tasks.length:0} tâches MÉTIS présentes localement.`:'Aucune donnée MÉTIS présente sur cette origine dans ce navigateur.')+'\\nDernière synchronisation Google enregistrée : '+timestamp+'. Ce relevé ne vérifie pas la validité de la session.';
 }catch{status.textContent='Stockage local indisponible ou illisible. Ouvre MÉTIS pour vérifier les sources.'}
}
refresh();window.addEventListener('storage',refresh);
