import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=path=>readFileSync(resolve(root,path),'utf8');
const canonical='https://janus-oren-patrick-os.vercel.app';

test('JANUS does not redirect module routes to a different origin',()=>{
 const config=JSON.parse(read('vercel.json'));
 for(const r of config.redirects||[]){
  if(['/metis','/music','/hermes'].some(x=>r.source?.startsWith(x))){
   assert(!r.destination?.startsWith('https://'),r.source+' must stay on JANUS');
  }
 }
});
test('secure response headers are declared for JANUS',()=>{
 const headers=JSON.parse(read('vercel.json')).headers?.flatMap(x=>x.headers)||[];
 for(const key of ['Referrer-Policy','X-Content-Type-Options']) assert(headers.some(h=>h.key===key));
});
test('JANUS and ARGOS agree on the origin',()=>{
 const model=read('public/oren-feed-model.mjs');
 assert(model.includes("METIS_ORIGIN = '"+canonical+"'"));
 assert(read('public/oren-projects.mjs').includes("HOME='"+canonical+"'"));
 assert(read('argos/index.html').includes(canonical+'/janus.html'));
});
test('diagnostic page and offline shell files exist',()=>{
 for(const file of ['public/diagnostic.html','public/diagnostic.mjs','public/sw.js','public/janus.html','public/manifest.webmanifest'])assert(existsSync(resolve(root,file)),file);
});
test('HERMES HTML contains no hard-coded account email',()=>{
 assert.doesNotMatch(read('public/hermes.html'),/<p class="account">[^<]+@[^<]+<\/p>/);
});
test('OREN transfer model strips direct email addresses from metadata',()=>{
 const m=read('public/oren-feed-model.mjs');
 assert(!m.includes('email:text(r.email)'));
 assert(m.includes('ARGOS_ORIGIN'));
});
