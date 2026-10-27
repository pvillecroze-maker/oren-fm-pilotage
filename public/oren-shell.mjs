import {HOME,projects} from './oren-projects.mjs';
// No credentials or personal data are read by the shared navigation.
if(window.self===window.top && !document.querySelector('oren-navigation')){
 const host=document.createElement('oren-navigation');
 const root=host.attachShadow({mode:'open'});
 const style=document.createElement('style');style.textContent=`:host{display:block;position:relative;z-index:160;font:14px/1.5 system-ui;color:#eaf5fb}nav{padding:12px 18px;background:#091824;border-bottom:1px solid #355267;display:flex;gap:14px;align-items:center;flex-wrap:wrap}a{color:#93e9dc;text-decoration:none;padding:7px 2px}a:focus-visible,summary:focus-visible{outline:2px solid #93e9dc;outline-offset:3px}b{letter-spacing:.15em;color:#e4cf9d}details{margin-left:auto}summary{cursor:pointer;padding:7px}section{position:absolute;right:12px;top:100%;width:min(360px,calc(100vw - 48px));max-height:65vh;overflow:auto;background:#102535;border:1px solid #355267;border-radius:12px;padding:14px;box-shadow:0 15px 40px #0008}section a,section span{display:block;padding:10px;border-bottom:1px solid #294455}section span{color:#9bb1be}a[aria-current=page]{text-decoration:underline;text-underline-offset:5px}@media(max-width:460px){nav{gap:10px;font-size:12px;padding:10px}b{letter-spacing:.05em}}`;
 const nav=document.createElement('nav');nav.setAttribute('aria-label','Univers OREN');
 function link(name,url){const a=document.createElement('a');a.textContent=name;a.href=url;if(new URL(url).origin===location.origin&&new URL(url).pathname===location.pathname)a.setAttribute('aria-current','page');return a}
 const brand=link('OREN','https://janus-oren-patrick-os.vercel.app/janus.html');const b=document.createElement('b');b.textContent='OREN';brand.replaceChildren(b);
 nav.append(brand,link('MÉTIS',HOME+'/metis/index.html'),link('ARGOS','https://argos-network.vercel.app/'),link('Connexions',HOME+'/connections.html'));
 const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('section');summary.textContent='Projets';
 for(const p of projects){if(p.url)list.append(link(p.name,p.url));else{const s=document.createElement('span');s.textContent=p.name+' · à raccorder';list.append(s)}}
 details.append(summary,list);nav.append(details);root.append(style,nav);document.body.prepend(host);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){details.open=false;summary.focus()}});
}
