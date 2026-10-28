import {projects,projectUrl} from './oren-projects.mjs';
import {ecosystem,spaces,projectStructure} from './olympos-structure.mjs';
const container=document.getElementById('projects');
function link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;return a}
for(const space of spaces){
 const section=document.createElement('section'),heading=document.createElement('h2'),grid=document.createElement('div');
 heading.textContent=space.name;grid.className='grid';
 section.append(heading,link('Ouvrir le domaine Drive',space.driveUrl));
 for(const p of projects.filter(p=>projectStructure[p.id]?.spaceId===space.id)){
  const info=projectStructure[p.id],card=document.createElement('article'),title=document.createElement('h3'),description=document.createElement('p'),state=document.createElement('p');
  title.textContent=p.name;description.textContent=p.detail;state.textContent=info.connection;state.className='connection-status';
  card.append(title,description,state,link('Ouvrir',p.url),link('Dossier de référence',info.driveUrl),link('Actions dans MÉTIS',projectUrl(p.name)));grid.append(card);
 }
 section.append(grid);container.append(section);
}
function refresh(){const status=document.getElementById('local');try{const raw=localStorage.getItem('metis-oren-v3-private')||localStorage.getItem('metis-v1-private');const data=raw?JSON.parse(raw):null;const sync=localStorage.getItem('metis-last-sync');const timestamp=sync&&Number.isFinite(Date.parse(sync))?new Date(sync).toLocaleString('fr-FR'):'aucune date disponible';status.textContent=(data?`${Array.isArray(data.tasks)?data.tasks.length:0} tâches MÉTIS présentes localement.`:'Aucune donnée MÉTIS présente sur cette origine dans ce navigateur.')+'\nDernière synchronisation Google enregistrée : '+timestamp+'. Ce relevé ne vérifie pas la validité de la session.'}catch{status.textContent='Stockage local indisponible ou illisible. Ouvre MÉTIS pour vérifier les sources.'}}
refresh();window.addEventListener('storage',refresh);
