const $ = (id) => document.getElementById(id);
const empty = (text) => `<p class="empty">${text}</p>`;
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const card = (item) => {
  if (!item) return empty('Aucune action détectée.');
  const link = item.link ? `<a href="${esc(item.link)}" target="_blank" rel="noopener">${esc(item.linkLabel || 'Ouvrir')}</a>` : '';
  return `<article class="card"><h3>${esc(item.title)}</h3>${item.description ? `<p>${esc(item.description)}</p>` : ''}${item.source ? `<small>${esc(item.source)}</small>` : ''}${item.deadline ? `<strong>${esc(item.deadline)}</strong>` : ''}${link}</article>`;
};
const renderList = (id, items, label) => { $(id).innerHTML = items?.length ? items.map(card).join('') : empty(label); };
function render(data) {
  $('date').textContent = new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(data.date || Date.now()));
  $('n3').textContent = `${data.focus3?.length || 0}/3`; $('n5').textContent = `${data.actions5?.length || 0}/5`; $('n7').textContent = `${data.watch7?.length || 0}/7`;
  renderList('agenda', data.agenda, 'Aucun rendez-vous ferme aujourd’hui.');
  $('first').innerHTML = card(data.firstAction);
  renderList('focus', data.focus3, 'Aucun cap défini.');
  renderList('actions', data.actions5, 'Aucun geste défini.');
  renderList('watch', data.watch7, 'Aucune vigie définie.');
  renderList('relances', data.relances, 'Aucune relance active.');
  localStorage.setItem('oren:lastBriefing', JSON.stringify(data));
}
async function load() {
  const password = localStorage.getItem('oren:password');
  if (!password) { $('status').textContent = 'Code d’accès requis.'; $('dialog').showModal(); return; }
  $('status').textContent = 'Synchronisation en cours…';
  try {
    const response = await fetch('/.netlify/functions/briefing', { headers: { Authorization: `Bearer ${password}` }, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Synchronisation refusée.');
    render(data.briefing || data);
    $('status').textContent = `Synchronisé à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}.`;
  } catch (error) {
    const cached = localStorage.getItem('oren:lastBriefing');
    if (cached) render(JSON.parse(cached));
    $('status').textContent = `Synchronisation impossible : ${error.message}`;
  }
}
$('settings').addEventListener('click', () => { $('password').value = localStorage.getItem('oren:password') || ''; $('dialog').showModal(); });
$('save').addEventListener('click', (event) => { event.preventDefault(); const value = $('password').value.trim(); if (!value) { $('error').textContent = 'Entre le code d’accès.'; return; } localStorage.setItem('oren:password', value); $('dialog').close(); load(); });
$('refresh').addEventListener('click', load);
const cached = localStorage.getItem('oren:lastBriefing'); if (cached) render(JSON.parse(cached));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
load();
