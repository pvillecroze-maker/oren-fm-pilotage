export const HOME='https://metis-oren-patrick-os.vercel.app';
export const projects=[
 {id:'janus',name:'JANUS',url:'https://janus-oren-patrick-os.vercel.app/janus.html',detail:'Portail et synthèses locales de MÉTIS, musique et ARGOS.'},
 {id:'metis',name:'MÉTIS',url:HOME+'/metis/index.html',detail:'Tâches, agenda et courriels. Session Google requise pour actualiser les sources.'},
 {id:'argos',name:'ARGOS',url:'https://argos-network.vercel.app/',detail:'Flux de métadonnées MÉTIS toutes les minutes, application visible. Même navigateur requis ; import JSON disponible en secours.'},
 {id:'music',name:'APOLLON',url:HOME+'/music/index.html',detail:'Musique et humeur. Synthèse locale accessible à JANUS.'},
 {id:'hermes',name:'HERMÈS',url:HOME+'/hermes.html',detail:'Tâches locales partagées avec la matrice simplifiée et le flux ARGOS.'},
 {id:'vox',name:'VOX DIEI',url:HOME+'/vox-diei.html',detail:'Accès à la veille radio. Pas de transfert de données vers ARGOS.'},
 {id:'pheme',name:'PHÈMÉ',url:'https://argos-oren-opinion-toulon.vercel.app/observatoire.html',detail:'Observatoire accessible. Connecteur de données non installé.'},
 {id:'dossier',name:'DOSSIER LAVALETTE',url:'https://pheme-dossier-lavalette.vercel.app/',detail:'Dossier accessible. Connecteur de données non installé.'},
 {id:'olympos',name:'OLYMPOS',url:'https://olympos-mobile-pv.vercel.app/',detail:'Documents et navigation mobile. Connecteur de données non installé.'},
 {id:'cap',name:'CAP',url:'https://cap-sans-tabac.vercel.app/',detail:'Application accessible. Données personnelles non partagées avec les autres modules.'},
 {id:'hypnos',name:'HYPNOS',url:null,detail:'Application non raccordée. Aucun transfert de données de sommeil.'}
];
export function projectUrl(name){return HOME+'/metis/project.html?project='+encodeURIComponent(String(name).slice(0,100));}
