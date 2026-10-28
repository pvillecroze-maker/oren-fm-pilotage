import test from 'node:test';
import assert from 'node:assert/strict';
import {projects} from '../public/oren-projects.mjs';
import {spaces,projectStructure} from '../public/olympos-structure.mjs';

test('every catalog project has exactly one existing domain and a Drive reference',()=>{
 const ids=new Set(spaces.map(s=>s.id));
 assert.equal(ids.size,spaces.length);
 assert.deepEqual(Object.keys(projectStructure).sort(),projects.map(p=>p.id).sort());
 for(const p of projects){
  const entry=projectStructure[p.id];
  assert(ids.has(entry.spaceId),p.name);
  assert.match(entry.driveUrl,/^https:\/\/drive\.google\.com\/drive\/folders\/[\w-]+$/);
  assert(entry.connection.length>10);
 }
});
test('specialized applications belong to their functional domains',()=>{
 for(const [id,domain] of [['cap','06'],['anteros','05'],['music','08'],['pheme','03'],['rade-rose','02'],['janus','00']])assert.equal(projectStructure[id].spaceId,domain);
 assert.equal(projectStructure.pheme.driveUrl,projectStructure.dossier.driveUrl);
});
