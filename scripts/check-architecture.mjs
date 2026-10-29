import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {projects} from '../public/oren-projects.mjs';
import {spaces,projectStructure} from '../public/olympos-structure.mjs';

// Contrôles sans données personnelles et sans réseau. Toute incohérence bloque le build.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const ids=projects.map(p=>p.id),urls=projects.map(p=>p.url);
assert.equal(new Set(ids).size,ids.length,'Identifiants de projets dupliqués');
assert.equal(new Set(urls).size,urls.length,'Deux projets partagent la même URL principale');
const spaceIds=spaces.map(s=>s.id);
assert.equal(new Set(spaceIds).size,spaceIds.length,'Domaines OLYMPOS en double');
assert.ok(spaces.some(s=>s.id==='00'),'Le pilotage MÉTIS a perdu son domaine');
for(const p of projects){
 assert.ok(projectStructure[p.id],'Projet sans dossier de référence : '+p.id);
 assert.ok(spaceIds.includes(projectStructure[p.id].spaceId),'Domaine absent : '+p.id);
 assert.ok(p.url.startsWith('https://'),'URL non explicite : '+p.id);
}
assert.equal(projects.filter(p=>p.id==='janus').length,1,'JANUS doit être le portail unique');
assert.ok(projects.find(p=>p.id==='olympos')?.legacy,'OLYMPOS Mobile doit rester un ancien accès');
assert.equal(projects.find(p=>p.id==='cap')?.name,'ÉLEUTHÉRIA','Nouveau nom grec absent');
assert.ok(projects.find(p=>p.id==='hermes'),'HERMÈS doit rester accessible');
const html=read('public/janus.html'),shell=read('public/oren-shell.mjs');
const main=html.match(/<section class="grid" aria-label="Accès principaux JANUS">([\s\S]*?)<\/section>/)?.[1];
assert.ok(main,'Accueil simplifié absent');
assert.equal((main.match(/class="card"/g)||[]).length,4,'JANUS doit présenter quatre accès principaux');
assert.ok(html.includes('JANUS CONTRÔLE · priorité'),'Garde-fous du jour absents');
assert.ok(html.includes('id="rolling-refresh"'),'Bilan cinq jours disparu');
assert.ok(html.includes('id="drive-spaces"'),'Dossiers OLYMPOS disparus');
assert.ok(!html.includes('▣ OLYMPOS MOBILE'),'Portail secondaire revenu sur l’accueil');
assert.ok(!html.includes('<strong>⌁ CAP</strong>'),'Ancien nom CAP revenu sur l’accueil');
assert.ok(shell.includes("brand=link('JANUS',HOME+'/janus.html')"),'Menu non centré sur JANUS');
assert.ok(!shell.includes("link('JANUS',HOME+'/janus.html'),link('MÉTIS'"),'Double lien JANUS dans le menu');
const shortcuts=html.match(/<section class="extensions" aria-label="Applications complémentaires OREN">([\s\S]*?)<\/section>/)?.[1]||'';
const directUrls=[...main.matchAll(/href="([^"]+)"/g),...shortcuts.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(directUrls).size,directUrls.length,'Deux accès directs JANUS pointent sur la même URL');
console.log('Architecture JANUS contrôlée : '+projects.length+' projets uniques ; '+spaces.length+' domaines OLYMPOS ; 4 accès principaux ; 0 doublon de destination.');
