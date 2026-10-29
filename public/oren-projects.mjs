export const HOME='https://janus-oren-patrick-os.vercel.app';
export const projects=[
 {id:'janus',name:'JANUS',url:HOME+'/janus.html',detail:'Portail central de toutes les applications et espaces de projets OREN.'},
 {id:'metis',name:'MÉTIS',url:HOME+'/metis/index.html',detail:'Tâches, agenda et courriels. Session Google requise pour actualiser les sources.'},
 {id:'anteros',name:'ANTEROS',url:'https://anteros-patrick.cosmic-spool-9901.chatgpt.site',detail:'Application personnelle distincte, accès privé. Aucune synchronisation ni import de photos ou fiches vers JANUS.'},
 {id:'argos',name:'ARGOS',url:'https://argos-network.vercel.app/',detail:'Réseau de contacts, édition de fiches et synchronisation privée via Google Drive (après consentement). Flux MÉTIS local et export JSON conservé.'},
 {id:'music',name:'APOLLON',url:HOME+'/music/index.html',detail:'Musique et humeur. Synthèse locale accessible à JANUS.'},
 {id:'hermes',name:'HERMÈS',url:HOME+'/hermes.html',detail:'Tâches locales partagées avec la matrice simplifiée et le flux ARGOS.'},
 {id:'vox',name:'VOX DIEI',url:HOME+'/vox-diei.html',detail:'Accès à la veille radio. Pas de transfert de données vers ARGOS.'},
 {id:'pheme',name:'PHÈMÉ',url:'https://argos-oren-opinion-toulon.vercel.app/observatoire.html',detail:'Observatoire accessible. Connecteur de données non installé.'},
 {id:'dossier',name:'DOSSIER LAVALETTE',url:'https://pheme-dossier-lavalette.vercel.app/',detail:'Dossier accessible. Connecteur de données non installé.'},
 {id:'olympos',name:'OLYMPOS MOBILE · ancien accès',url:'https://olympos-mobile-pv.vercel.app/',detail:'Ancien accès mobile conservé pour consultation ; JANUS est le portail unique. Vérifier les données avant toute désactivation.'},
 {id:'cap',name:'ÉLEUTHÉRIA',url:'https://cap-sans-tabac.vercel.app/',detail:'Accompagnement de l’arrêt du tabac. Données personnelles non partagées avec les autres modules. Ancien nom CAP ; URL conservée.'},
 {id:'athena',name:'ATHÉNA',url:'https://drive.google.com/drive/folders/123FKYdj1yY8o7prLpq7a8uKRyJPiSHEo',detail:'Espace Google Drive emploi et candidatures, pas une application synchronisée.'},
 {id:'calliope',name:'CALLIOPE',url:'https://drive.google.com/drive/folders/1cvwZ24QhEcsjJjKofN2LDu4D82wt_yJX',detail:'Espace Google Drive communication, FD83 et engagements.'},
 {id:'rade-rose',name:'LA RADE ET LA ROSE',url:'https://docs.google.com/spreadsheets/d/1l8Es0Y9TjP7lRXcZ_b5k52q4dfEidKosUa4ZE30v89A/edit',detail:'Tableau rédactionnel en activité, fichier Google Sheets distinct d’une application.'},
 {id:'hestia',name:'HESTIA',url:'https://drive.google.com/drive/folders/1dKxcQjP8zvZZLJ5JkDfkSwD2erFarL7d',detail:'Espace Google Drive administration et vie personnelle.'},
 {id:'hygie',name:'HYGIE',url:'https://drive.google.com/drive/folders/1YTxCSdannoC8yDmfv2pJbYobnjCGjMxz',detail:'Espace Google Drive santé et habitudes ; pas de transfert de données.'},
 {id:'hypnos',name:'HYPNOS',url:'https://drive.google.com/drive/folders/1HXsHw_P3KKFcbZDERUHpzhtY_alvQO79',detail:'Espace Google Drive sommeil et récupération ; aucune PWA HYPNOS vérifiée.'},
 {id:'harmonia',name:'HARMONIA',url:'https://drive.google.com/drive/folders/1ehqnrOZyRzkAU82JPCbw3yaymNNZUyq2',detail:'Espace Google Drive humeur et musique ; APOLLON est le module applicatif.'},
 {id:'mnemosyne',name:'MNÉMOSYNE',url:'https://drive.google.com/drive/folders/12Q_m-eqxMFi0gbad5NitE_JBkjCIyAFv',detail:'Espace Google Drive mémoire documentaire et archives.'}
];
export function projectUrl(name){return HOME+'/metis/project.html?project='+encodeURIComponent(String(name).slice(0,100));}
