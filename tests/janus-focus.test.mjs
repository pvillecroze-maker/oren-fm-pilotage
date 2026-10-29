import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('public/janus.html');
const focus=read('public/janus-focus.mjs');
test('JANUS has four main routes: today, network, dossiers, control',()=>{
 const main=html.match(/<section class="grid" aria-label="Accès principaux JANUS">([\s\S]*?)<\/section>/)?.[1]||'';
 assert.equal((main.match(/class="card"/g)||[]).length,4);
 for(const title of ["Aujourd'hui","Mon réseau","Mes dossiers","Contrôle"])assert.ok(main.includes('<h2>'+title+'</h2>'),title);
 assert.ok(html.includes('Mes applications et outils secondaires'),'Applications still reachable');
});
test('JANUS focus stays read only and never invents a Google sync',()=>{
 assert.ok(html.includes('id="janus-focus-list"'));
 assert.ok(html.includes('/janus-focus.mjs'));
 assert.ok(focus.includes('localStorage.getItem('));
 assert.ok(focus.includes('slice(0,3)'));
 assert.ok(focus.includes("textContent=t.title.slice(0,220)"));
 assert.doesNotMatch(focus,/fetch\s*\(|localStorage\.setItem\s*\(|innerHTML\s*=/);
 assert.ok(focus.includes('Aucune donnée MÉTIS locale accessible'));
 const check=spawnSync(process.execPath,['--check',resolve(root,'public/janus-focus.mjs')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});
test('JANUS offline cache includes focus module',()=>{
 assert.ok(read('public/sw.js').includes("'/janus-focus.mjs'"));
});
