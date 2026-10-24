export function personId(c) {
  const key = (c['ARGOS - Email principal'] || c['E-mail 1 - Value'] || [c['First Name'],c['Last Name'],c['Organization Name'],c['Phone 1 - Value']].join('|')).trim().toLowerCase();
  return 'p:' + encodeURIComponent(key);
}
export const personName = c => [c['First Name'],c['Last Name']].filter(Boolean).join(' ') || c['Organization Name'] || 'Sans nom';
export function makeGraph(contacts, relations = [], {query='', organizations=true, limit=250}={}) {
  const unique = new Map(contacts.map(c=>[personId(c),c]));
  const people = [...unique].filter(([,c])=>[personName(c),c['Organization Name'],c['ARGOS - Profession']].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0,limit);
  const ids = new Set(people.map(([id])=>id));
  const edges = relations.filter(r=>ids.has(r.from)&&ids.has(r.to)&&r.from!==r.to).map(r=>({...r,kind:'relation'}));
  const nodes = people.map(([id,c])=>({id,label:personName(c),kind:'person',contact:c,degree:edges.filter(e=>e.status==='documented'&&(e.from===id||e.to===id)).length}));
  if(organizations) for(const [id,c] of people) {
    const label=(c['Organization Name']||'').trim(); if(!label)continue;
    const org='o:'+label.toLowerCase();
    if(!nodes.some(n=>n.id===org))nodes.push({id:org,label,kind:'organization',degree:0});
    edges.push({id:'membership:'+id,from:id,to:org,kind:'organization',type:'Organisation renseignée',status:'imported',source:'Champ organisation du contact'});
  }
  return {nodes,edges,total:unique.size,visible:people.length};
}
export function validateRelation(r,contacts) {
  const ids=new Set(contacts.map(personId));
  if(!ids.has(r.from)||!ids.has(r.to))throw Error('Sélectionne deux personnes présentes dans ton annuaire.');
  if(r.from===r.to)throw Error('Choisis deux personnes différentes.');
  if(!String(r.source||'').trim())throw Error('Précise la source ou le contexte de cette relation.');
  if(!['documented','unverified'].includes(r.status))throw Error('Statut de relation invalide.');
  return {...r,source:String(r.source).trim().slice(0,500),type:String(r.type||'Échange').slice(0,80)};
}
