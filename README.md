# Oren FM — Pilotage 3·5·7

PWA quotidienne connectée à Gmail et Google Agenda via Netlify Functions et Google Apps Script.

## Déploiement

1. Connecter ce dépôt à un nouveau site Netlify.
2. Ajouter les variables privées nécessaires dans Netlify.
3. Déployer le site.
4. Copier le script du dossier `google-apps-script` dans un nouveau projet Google Apps Script, l’autoriser, puis le publier comme application Web.
5. Ouvrir la PWA sur iPhone et saisir le code d’accès défini pour le site.

Les données Gmail et Agenda ne sont pas intégrées au code du site.

## APOLLON / Vercel

Le site statique est publié depuis `public/` (Output Directory Vercel : `public`). L'application principale est `/` et le sondage musical APOLLON est accessible à `/apollon.html`.

## Navigation interprojets OREN

`public/oren-projects.mjs` est le registre partagé des destinations. Le menu
`public/oren-shell.mjs` est chargé par les pages centrales et compilé dans ARGOS.
Il ne lit ni ne transmet de données personnelles et ne s'affiche pas dans les
iframes de synchronisation. `/connections.html` distingue les flux existants des
accès par lien ; les fiches d'actions utilisent le champ Projet exact de MÉTIS.
Les applications externes ne reçoivent pas automatiquement le menu ni de données.
La passerelle MÉTIS–ARGOS reste locale au navigateur, avec export/import JSON
comme secours. Aucun service de synchronisation permanente entre appareils n'est
ajouté par cette version.

Validation : `bash scripts/build-oren.sh`, `npm ci --prefix argos`,
`npm run build --prefix argos`, `node --test argos/tests/*.test.js`,
`node metis/tests/mail-sync.test.cjs`.
