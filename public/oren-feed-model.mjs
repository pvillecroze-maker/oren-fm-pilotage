// Explicit metadata allowlist: never transfer tokens, message bodies or free-form notes.
export const METIS_ORIGIN = 'https://janus-oren-patrick-os.vercel.app';
export const ARGOS_ORIGIN = 'https://argos-network.vercel.app';
const text = v => typeof v === 'string' ? v.trim().slice(0,500) : '';
const rows = v => Array.isArray(v) ? v.slice(0,20000) : [];
export function normalizeFeed(data) {
 if (!data || data.app !== 'OREN' || data.version !== 1 || !Array.isArray(data.items) || data.items.length > 60000) throw Error('Flux OREN invalide');
 const unique = new Map();
 for (const r of data.items) {
  if (!r || !['MÉTIS','HERMÈS'].includes(r.source) || !['task','event','mail'].includes(r.kind)) continue;
  const id=text(r.id),title=text(r.title); if(!id||!title)continue;
  const item={id,source:r.source,kind:r.kind,title,project:text(r.project),date:text(r.date),status:text(r.status),url:''};
  try { const u=new URL(r.url);if(u.protocol==='https:'&&['mail.google.com','calendar.google.com','janus-oren-patrick-os.vercel.app','metis-oren-patrick-os.vercel.app'].includes(u.hostname))item.url=u.href; } catch {}
  unique.set(item.source+':'+item.kind+':'+id,item);
 }
 return {app:'OREN',version:1,at:text(data.at),items:[...unique.values()]};
}
export function collectFeed(read) {
 const parse=key=>{const raw=read(key);return raw?JSON.parse(raw):null;};
 const state=parse('metis-oren-v3-private')||parse('metis-v1-private')||{};
 const items=[];
 for (const t of rows(state.tasks))items.push({source:'MÉTIS',kind:'task',id:String(t.id||''),title:t.title,project:t.project,date:t.due,status:t.status,url:t.mail||t.calendar});
 for (const e of rows(state.events))items.push({source:'MÉTIS',kind:'event',id:String(e.id||''),title:e.title,date:e.date||e.start||'',url:e.url});
 for (const m of rows(state.mails))items.push({source:'MÉTIS',kind:'mail',id:String(m.id||''),title:m.title,date:m.date&&Number.isFinite(Date.parse(m.date))?new Date(m.date).toISOString():'',url:m.url});
 for (const t of rows(parse('metis:tasks:v1')))items.push({source:'HERMÈS',kind:'task',id:String(t.id||''),title:t.name,status:t.done?'Terminé':'À faire'});
 return normalizeFeed({app:'OREN',version:1,at:new Date().toISOString(),items});
}
export function validReply(e,source,nonce) {
 return !!source && e.origin===METIS_ORIGIN && e.source===source && e.data?.type==='oren:feed' && e.data.nonce===nonce;
}
