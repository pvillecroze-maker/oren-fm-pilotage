'use strict';
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;root.SillageEngine=engine})(typeof window!=='undefined'?window:globalThis,function(){
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
 const normalized=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const songKey=(s)=>normalized(s.artist)+'::'+normalized(s.title);
 const uniqueCatalog=(one,two)=>{const map=new Map();for(const s of [...one,...two]){if(!s||!s.artist||!s.title)continue;const key=songKey(s),prev=map.get(key);if(prev){const genericSource=(s.sources||[]).every(t=>t==='import'||t==='apple');map.set(key,{...prev,...s,id:key,kind:genericSource?prev.kind:s.kind,level:genericSource?prev.level:s.level,vocal:genericSource?prev.vocal:s.vocal,album:s.album||prev.album||'',url:s.url||prev.url||'',sources:[...new Set([...(prev.sources||[]),...(s.sources||[])])],legacyModulationId:s.legacyModulationId||prev.legacyModulationId})}else map.set(key,{...s,id:key,sources:s.sources||['import']});}return [...map.values()]};
 const validISO=(v)=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
 const num=(v,min,max,def)=>Number.isFinite(+v)&&v!==null&&v!==''?clamp(v,min,max):def;
 function normalizeEntry(src,origin='import'){
  if(!src||typeof src!=='object')return null;
  const date=src.date||src.day||src.dayISO||src.createdAt?.slice(0,10);
  if(!validISO(date))return null;
  const energy=num(src.energy,1,10,5),focus=num(src.focus??src.concentration,1,10,5),mood=num(src.mood??src.humeur,1,10,5);
  const oldAgitation=num(src.agitation,1,10,5);
  const load=num(src.load??src.mentalLoad??src.chargeMentale??oldAgitation,1,10,5);
  const calm=num(src.calm??src.calme??(11-oldAgitation),1,10,5);
  const sleep=num(src.sleep??src.sleepHours??src.sommeil,0,16,7);
  const rawNeed=src.sleepNeed||src.need||'normal'; const sleepNeed=({'moins':'less','habituel':'normal','plus':'more'})[rawNeed]||(['less','normal','more'].includes(rawNeed)?rawNeed:'normal');
  const e={id:src.id||'import:'+origin+':'+date,source:origin,date,energy,focus,mood,load,calm,sleep,sleepNeed,activity:src.activity||'deep',note:String(src.note||src.memo||'').slice(0,1200),updatedAt:src.updatedAt||new Date().toISOString()};
  return e;
 }
 const entrySignature=(x)=>[x.date,x.energy,x.focus,x.mood,x.load,x.calm,x.sleep,x.sleepNeed,x.note].join('|');
 function mergeHistory(oldList,newList){const all=[];const keys=new Set();for(const raw of [...oldList,...newList]){const x=normalizeEntry(raw,raw.source||'import');if(!x)continue;const s=entrySignature(x);if(keys.has(s))continue;keys.add(s);all.push(x)}return all.sort((a,b)=>a.date.localeCompare(b.date)||String(a.updatedAt).localeCompare(String(b.updatedAt)))}
 function assess(d,previous=[]){if(!d)return {mode:'balance',label:'Équilibre',summary:'Enregistre un bilan pour adapter la session.',watch:''};let mode='balance',label='Équilibre dynamique';if(d.load>=7||d.calm<=4||(d.energy>=7&&d.focus<=5)){mode='focus';label='Canaliser l’énergie'}else if(d.energy<=4&&d.sleep>=5&&d.calm>=5){mode='drive';label='Retrouver de l’élan'}else if(d.mood<=4||d.sleep<=5){mode='calm';label='Ralentir le tempo'}const sentences=[];if(d.energy>=7)sentences.push('Ton énergie déclarée est élevée');else if(d.energy<=4)sentences.push('Ton énergie déclarée est plutôt basse');else sentences.push('Ton énergie paraît intermédiaire');if(d.focus<=5)sentences.push('ta concentration peut bénéficier d’une ambiance moins chargée');else sentences.push('ta concentration se situe dans la moitié haute de l’échelle');if(d.load>=7)sentences.push('la charge mentale rapportée est importante');else if(d.calm>=7)sentences.push('le calme ressenti est relativement élevé');const p=previous.filter(x=>x.date<d.date).sort((a,b)=>b.date.localeCompare(a.date))[0];let trend='';if(p){let delta=d.energy-p.energy; if(Math.abs(delta)>=2)trend=`Ton énergie a ${delta>0?'augmenté':'diminué'} de ${Math.abs(delta)} points par rapport au dernier bilan.`;}const reduced=d.sleep<=6&&d.sleepNeed==='less'&&d.energy>=7;const repeated=reduced&&previous.some(x=>x.date!==d.date&&x.sleep<=6&&x.sleepNeed==='less'&&x.energy>=7&&Math.abs((Date.parse(d.date)-Date.parse(x.date))/86400000)<=4);const watch=repeated?'Plusieurs bilans associent énergie élevée et besoin de sommeil réduit. Si c’est un changement inhabituel, contacte rapidement ton professionnel de santé. Cette lecture ne constitue pas un diagnostic.':reduced?'Tu signales beaucoup d’énergie et moins de besoin de dormir. Surveille l’évolution, particulièrement si cela diffère de ton rythme habituel. Ce bilan ne pose aucun diagnostic.':'';return {mode,label,summary:sentences.join(' ; ')+'. '+trend,watch,trend,shortSleep:reduced};}
 // Ascent/descent keeps adjacent musical levels close; bridge tracks join piano and britpop.
 function buildPlan(count,britShare,mode){
  const n=clamp(count,10,100),brit=Math.round(n*clamp(britShare,10,70)/100);
  const bridge=Math.max(3,Math.round(n*(mode==='focus'||mode==='calm'?0.27:0.24)));
  const neo=Math.max(0,n-brit-bridge);
  const a=Math.max(1,Math.round(neo*.34)),b=Math.max(1,Math.round(neo*.26));
  const b1=Math.max(1,Math.round(bridge*.25)),b2=Math.max(1,Math.round(bridge*.25)),b3=Math.max(1,Math.round(bridge*.25));
  const r1=Math.max(1,Math.round(brit*.58));
  const groups=[['neo',a],['bridge',b1],['britpop',r1],['bridge',b2],['neo',b],['bridge',b3],['britpop',brit-r1],['bridge',bridge-b1-b2-b3],['neo',neo-a-b]];
  const out=[];for(const [kind,count] of groups)for(let i=0;i<count;i++)out.push(kind);
  return out.slice(0,n);
 }
 function createSession({catalog,count=25,britpopShare=40,mode='focus',entry=null,favorites=[],ratings={},played=[],vocal='auto',seed=''}={}){
  if(!Array.isArray(catalog)||!catalog.length)return [];
  const targetMode=['focus','balance','drive','calm'].includes(mode)?mode:'balance';let share=clamp(britpopShare,10,70);
  if(targetMode==='focus'&&entry?.activity==='deep')share=Math.min(share,35);
  if(targetMode==='calm')share=Math.min(share,28);
  if(targetMode==='drive')share=Math.max(share,35);
  const plan=buildPlan(count,share,targetMode);const selected=[];const used=new Set();const recent=new Set(played.slice(-150));const favSet=new Set(favorites);
  const seedNo=[...String(seed||entry?.date||'music')].reduce((a,c)=>(a*33+c.charCodeAt(0))%2147483647,17);
  for(let j=0;j<plan.length;j++){
   const cat=plan[j];let pool=catalog.filter(x=>!used.has(x.id));if(!pool.length)break;
   let ranked=pool.map(s=>{
     const kind=s.kind==='passerelle'?'bridge':s.kind;const isNeo=kind==='neo',isBrit=kind==='britpop'||kind==='indie',isBridge=kind==='bridge';
     const match=cat==='neo'?isNeo:cat==='britpop'?isBrit:isBridge;
     let score=match?35:cat==='bridge'&&isNeo?18:10;
     const level=Number.isFinite(+s.level)?+s.level:2;
     if(selected.length){const prior=selected[selected.length-1];score-=Math.max(0,Math.abs(level-(prior.level??2))-1)*5;if(normalized(prior.artist)===normalized(s.artist))score-=30;}
     if(targetMode==='focus'){score-=(level>=4?12:0);score-=(s.vocal&&entry?.activity==='deep'?10:0)}
     if(targetMode==='drive'){score+=level*1.1}
     if(targetMode==='calm')score+=isNeo?6:-level*1.8;
     if(vocal==='reduced'||(vocal==='auto'&&entry?.activity==='deep'))score-=(s.vocal?15:0);
     if(favSet.has(s.id))score+=9;
     score+=clamp(ratings[s.id]||0,-2,2)*4;
     if(recent.has(s.id))score-=7;
     const h=[...s.id].reduce((x,c)=>(x*31+c.charCodeAt(0))%9973,seedNo+j*13);score+=h/9973*5;
     return {s,score};}).sort((a,b)=>b.score-a.score);
   const chosen=ranked[0]?.s;if(!chosen)break;selected.push(chosen);used.add(chosen.id)
  }return selected;
 }
 function parseCSV(text){if(text.charCodeAt(0)===0xfeff)text=text.slice(1);const lines=[];let cell='',row=[],inside=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(inside&&text[i+1]==='"'){cell+='"';i++}else inside=!inside}else if(ch===','&&!inside){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!inside){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(c=>c.trim()))lines.push(row);cell='';row=[]}else cell+=ch}row.push(cell);if(row.some(c=>c.trim()))lines.push(row);if(!lines.length)return[];const header=lines[0].map(normalized);const ti=header.findIndex(x=>['title','titre','song','track'].includes(x)),ai=header.findIndex(x=>['artist','artiste','interprete'].includes(x)),li=header.indexOf('album');if(ti<0||ai<0)throw Error('Le CSV doit contenir les colonnes title et artist (ou titre et artiste).');return lines.slice(1).map(cols=>({title:cols[ti]?.trim()||'',artist:cols[ai]?.trim()||'',album:cols[li]?.trim()||'',kind:'bridge',level:2,vocal:1,sources:['import']})).filter(s=>s.title&&s.artist).slice(0,15000)}
 return {clamp,normalized,songKey,uniqueCatalog,validISO,normalizeEntry,entrySignature,mergeHistory,assess,createSession,buildPlan,parseCSV};
});
