import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=fs.readFileSync(fileURLToPath(new URL('../src/cloud-sync.js',import.meta.url)),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
function makeDrive(){
 const data={file:null,version:0};
 return {
  data,
  async fetch(url,opts={}){
   const u=new URL(url),list=u.pathname==='/drive/v3/files'&&u.searchParams.has('spaces');
   const meta=u.pathname.endsWith('/drive/v3/files/shared')&&!u.searchParams.has('alt');
   const media=u.pathname.endsWith('/drive/v3/files/shared')&&u.searchParams.get('alt')==='media';
   const created=u.pathname==='/upload/drive/v3/files'&&opts.method==='POST';
   const updated=u.pathname==='/upload/drive/v3/files/shared'&&opts.method==='PATCH';
   const reply=obj=>({ok:true,status:200,json:async()=>clone(obj)});
   if(list)return reply({files:data.file?[{id:'shared',version:String(data.version)}]:[]});
   if(media)return reply(data.file);
   if(meta)return reply({id:'shared',version:String(data.version)});
   if(created){const body=String(opts.body),sections=body.split('\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n');if(sections.length!==3)throw Error('invalid multipart');data.file=JSON.parse(sections[2].split('\r\n--')[0]);data.version=1;return reply({id:'shared',version:String(data.version)})}
   if(updated){data.file=JSON.parse(opts.body);data.version++;return reply({id:'shared',version:String(data.version)})}
   throw Error('Unexpected fetch '+url);
  }
 };
}
function app(drive,initial){
 const data=clone(initial),store=new Map(),map=new Map(),listeners=new Map();
 const element=()=>({style:{},innerHTML:'',textContent:'',hidden:false,disabled:false,after(){},append(){},onclick:null});
 const el=id=>{if(!map.has(id))map.set(id,element());return map.get(id)};
 const document={createElement:element,getElementById:el,querySelector:element,addEventListener:(name,fn)=>{const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a)}};
 const window={argon:null,google:{accounts:{oauth2:{initTokenClient:args=>({requestAccessToken(){args.callback({access_token:'test',expires_in:3600})}})}}},addEventListener:(name,fn)=>{const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a)},argosGetNetworkSnapshot:()=>({version:1,contacts:data.contacts,relations:data.relations}),argosApplyCloudSnapshot:async incoming=>{data.contacts=clone(incoming.contacts);data.relations=clone(incoming.relations)}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const ctx={window,document,localStorage,crypto:webcrypto,TextEncoder,Uint8Array,URL,Date,JSON,fetch:drive.fetch,setInterval:()=>0,setTimeout,clearTimeout,AbortController,confirm:()=>true,console};ctx.google=window.google;
 vm.runInNewContext(source,ctx,{filename:'cloud-sync.js'});
 const done=async needle=>{for(let i=0;i<60;i++){if(el('argosDriveStatus').textContent.includes(needle))return;await sleep(10)}throw Error('Expected '+needle+' got '+el('argosDriveStatus').textContent)};
 return {data,el,connect:()=>el('argosDriveConnect').onclick(),sync:()=>el('argosDriveSync').onclick(),done,localStorage,change:(c)=>{data.contacts.push(c);}};
}
test('first ARGOS session creates a private Drive reference then another device downloads it',async()=>{
 const drive=makeDrive(),first=app(drive,{contacts:[{'First Name':'Alice'}],relations:[]});
 first.connect();await first.done('ARGOS → Drive');
 assert.equal(drive.data.file.contacts.length,1);
 const second=app(drive,{contacts:[],relations:[]});second.connect();await second.done('Drive → ARGOS');
 assert.equal(second.data.contacts.length,1);assert.equal(second.data.contacts[0]['First Name'],'Alice');
 first.change({'First Name':'Bob'});first.sync();await first.done('modifications locales enregistrées');
 second.sync();await second.done('Drive → ARGOS');assert.equal(second.data.contacts.length,2);
});
test('simultaneous local and remote changes stop before overwriting',async()=>{
 const drive=makeDrive(),a=app(drive,{contacts:[{name:'Initial'}],relations:[]});
 a.connect();await a.done('ARGOS → Drive');
 a.change({name:'Local'});
 drive.data.file.contacts.push({name:'Remote'});drive.data.version++;
 a.sync();await a.done('Conflit');
 assert.equal(drive.data.file.contacts.length,2);
 assert.equal(a.data.contacts.length,2);
 assert.equal(a.el('argosDrivePull').hidden,false);
 assert.equal(a.el('argosDrivePush').hidden,false);
});
