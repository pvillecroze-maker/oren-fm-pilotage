const OREN = { TZ: 'Europe/Paris', EMAIL: 'pvillecroze@gmail.com', MAX: { agenda: 12, focus: 3, actions: 5, watch: 7, relances: 12 } };

function initialiserOrenFM() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('OREN_SYNC_TOKEN')) p.setProperty('OREN_SYNC_TOKEN', Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,''));
  Logger.log('Jeton Oren FM créé. Copie-le uniquement dans les variables Netlify.');
}

function testerOrenFM() {
  const b = construireBriefing_();
  Logger.log(JSON.stringify({ok:true, agenda:b.agenda.length, caps:b.focus3.length, gestes:b.actions5.length, vigies:b.watch7.length}));
  return b;
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const expected = PropertiesService.getScriptProperties().getProperty('OREN_SYNC_TOKEN');
  if (!expected || params.token !== expected) return json_({ok:false,error:'Jeton Apps Script invalide.'});
  if (params.mode === 'health') return json_({ok:true, service:'oren-fm'});
  try { return json_({ok:true, briefing:construireBriefing_()}); }
  catch (err) { return json_({ok:false,error:'Erreur Gmail ou Agenda : '+err.message}); }
}

function construireBriefing_() {
  const now = new Date();
  const agenda = CalendarApp.getDefaultCalendar().getEventsForDay(now).sort((a,b)=>a.getStartTime()-b.getStartTime()).slice(0,OREN.MAX.agenda).map(event_);
  const seen = {};
  const threads = [];
  ['newer_than:14d {label:"À traiter" label:"À relancer" is:important is:starred}','newer_than:3d is:unread -category:promotions -category:social'].forEach(q=>GmailApp.search(q,0,60).forEach(t=>{if(!seen[t.getId()]){seen[t.getId()]=true;threads.push(t)}}));
  const rows = threads.map(mail_).filter(Boolean).filter(x=>!bruit_(x)).sort((a,b)=>b.score-a.score || b.date-a.date);
  const relances = rows.filter(x=>x.relance).slice(0,OREN.MAX.relances).map(x=>item_(x,'Aujourd’hui'));
  const operational = rows.filter(x=>!x.relance);
  const first = operational[0] ? item_(operational[0], operational[0].urgent?'À traiter aujourd’hui':'') : (agenda[0] || {title:'Aucune urgence détectée',description:'Ouvre Gmail et vérifie les nouveaux messages.',source:'Oren FM'});
  return {date:Utilities.formatDate(now,OREN.TZ,'yyyy-MM-dd'),generatedAt:now.toISOString(),agenda:agenda,firstAction:first,focus3:operational.slice(0,OREN.MAX.focus).map(x=>item_(x,'')),actions5:operational.slice(OREN.MAX.focus,OREN.MAX.focus+OREN.MAX.actions).map(x=>item_(x,'')),watch7:operational.slice(OREN.MAX.focus+OREN.MAX.actions,OREN.MAX.focus+OREN.MAX.actions+OREN.MAX.watch).map(x=>item_(x,'')),relances:relances};
}

function mail_(thread) {
  const messages = thread.getMessages(); if (!messages.length) return null;
  const m = messages[messages.length-1], labels = thread.getLabels().map(l=>l.getName());
  const subject = m.getSubject() || '(sans objet)', body = clean_(m.getPlainBody()).slice(0,280), lower = (subject+' '+m.getFrom()+' '+body).toLowerCase();
  const relance = labels.includes('À relancer'), traiter = labels.includes('À traiter');
  const urgent = /mise en demeure|impay|régularis|paiement|échéance|résiliation|convocation|avocat|doctolib|médecin|santé|cpam|ameli|recouvrement/.test(lower);
  let score=(traiter?80:0)+(relance?60:0)+(thread.isUnread()?20:0)+(urgent?50:0)+(m.isStarred()?25:0);
  return {title:subject,description:body,source:m.getFrom()+' · '+Utilities.formatDate(m.getDate(),OREN.TZ,'dd/MM HH:mm'),date:m.getDate().getTime(),score:score,relance:relance,urgent:urgent,link:thread.getPermalink(),linkLabel:'Ouvrir Gmail'};
}
function item_(x,deadline){return {title:x.title,description:x.description,source:x.source,deadline:deadline,link:x.link,linkLabel:x.linkLabel};}
function event_(e){const email=Session.getEffectiveUser().getEmail()||OREN.EMAIL;const eid=Utilities.base64EncodeWebSafe(e.getId()+' '+email).replace(/=+$/,'');return {title:e.getTitle()||'Rendez-vous',description:clean_(e.getDescription()).slice(0,220),source:Utilities.formatDate(e.getStartTime(),OREN.TZ,'HH:mm')+'–'+Utilities.formatDate(e.getEndTime(),OREN.TZ,'HH:mm'),link:'https://calendar.google.com/calendar/u/0/r?eid='+encodeURIComponent(eid),linkLabel:'Ouvrir Agenda'};}
function bruit_(x){return /linkedin|leboncoin|gens de confiance|needhelp|strava|newsletter|publicit|promotion/.test((x.title+' '+x.source).toLowerCase()) && x.score<50;}
function clean_(s){return String(s||'').replace(/\s+/g,' ').trim();}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
