/* JANUS : vue rapide en lecture seule des données MÉTIS locales.
   Aucun accès Google implicite, aucune écriture, aucun transfert réseau. */
const list=document.getElementById('janus-focus-list');
const note=document.getElementById('janus-focus-status');
const source=document.getElementById('janus-focus-source');
function readMetis(){
  try{
    const raw=localStorage.getItem('metis-oren-v3-private')||localStorage.getItem('metis-v1-private');
    const data=raw?JSON.parse(raw):null;
    return data&&Array.isArray(data.tasks)?data:null;
  }catch{return null;}
}
function deadline(task){
  if(!task?.due)return Infinity;
  const value=String(task.due);
  const d=/^\d{4}-\d{2}-\d{2}$/.test(value)?new Date(value+'T23:59:59'):new Date(value);
  return Number.isFinite(d.getTime())?d.getTime():Infinity;
}
function actionable(task){
  if(!task||typeof task.title!=='string'||!task.title.trim())return false;
  return !/^(terminé|termine|fait|done|annulé|annule|reporté|reporte|en attente)$/i.test(String(task.status||'').trim());
}
function quadrant(task,now){
  if(!task.important)return null; // La synthèse rapide ne présente que Q1 et Q2.
  return task.urgent||deadline(task)<now+48*3600*1000?'Q1':'Q2';
}
function renderFocus(){
  const data=readMetis();
  list.replaceChildren();
  if(!data){
    note.textContent='Aucune donnée MÉTIS locale accessible sur cet appareil.';
    source.textContent='Ouvre MÉTIS pour consulter ou importer tes actions. La feuille Google n’est pas interrogée depuis JANUS.';
    return;
  }
  const now=Date.now();
  const tasks=data.tasks.filter(actionable).map(t=>({...t,janusQ:quadrant(t,now)}))
    .filter(t=>t.janusQ).sort((a,b)=>(a.janusQ===b.janusQ?deadline(a)-deadline(b):a.janusQ.localeCompare(b.janusQ)))
    .slice(0,3);
  if(!tasks.length){
    note.textContent='Aucune tâche Q1 ou Q2 ouverte dans les données locales.';
  }else{
    note.textContent=tasks.length+' priorité'+(tasks.length>1?'s':'')+' locale'+(tasks.length>1?'s':'')+' à examiner.';
    tasks.forEach(t=>{
      const li=document.createElement('li');
      const badge=document.createElement('span');badge.className='daily-q '+t.janusQ.toLowerCase();badge.textContent=t.janusQ;
      const body=document.createElement('span');body.className='daily-task';
      const title=document.createElement('strong');title.textContent=t.title.slice(0,220);
      const detail=document.createElement('small');const parts=[];
      if(t.project)parts.push(String(t.project).slice(0,90));
      if(Number.isFinite(deadline(t)))parts.push('Échéance : '+new Date(deadline(t)).toLocaleDateString('fr-FR',{timeZone:'Europe/Paris'}));
      detail.textContent=parts.join(' · ');
      body.append(title,detail);li.append(badge,body);list.append(li);
    });
  }
  let stamp='';
  if(data.updated&&!Number.isNaN(Date.parse(data.updated))){
    const d=new Date(data.updated);stamp=' · version locale du '+d.toLocaleString('fr-FR');
    if(now-d.getTime()>48*3600*1000)stamp+=' (à actualiser)';
  }
  source.textContent='Source : tâches MÉTIS enregistrées dans ce navigateur'+stamp+'. Ni Agenda ni Google Sheets en temps réel. Aucune tâche créée ou modifiée.';
}
renderFocus();
window.addEventListener('storage',e=>{if(e.key===null||['metis-oren-v3-private','metis-v1-private'].includes(e.key))renderFocus()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderFocus()});
