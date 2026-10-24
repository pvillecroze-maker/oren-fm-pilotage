# MÉTIS — PATRICK OS 4.2

PWA privée : les données sont conservées dans le navigateur et dans les services Google autorisés. Aucun courriel ni tâche personnelle n’est livré dans les sources.

- Les statuts Sheets sont relus à chaque actualisation (60 secondes, application visible et session Google valide).
- Cases et formulaire écrivent le statut dans MATRICE MOBILE, avec relecture de confirmation.
- Les titres absents ou dupliqués et les statuts divergents bloquent une écriture.
- Les opérations Sheets et la synchronisation sont sérialisées sur cet appareil. Google Sheets ne fournit pas ici une transaction atomique entre appareils : une modification simultanée reste possible.
- Les autres champs et les nouvelles tâches restent locaux ; ils ne sont pas ajoutés au classeur.
- Agenda et Gmail sont lus, jamais modifiés. La copie Drive peut être suspendue si aucun ETag n’est fourni.
- Connecter Google sur chaque appareil. Activer les API Calendar, Gmail, Drive et Sheets ; autoriser l’origine HTTPS de production dans le client OAuth.

Déploiement : dossier `metis` du dépôt oren-fm-pilotage vers le projet Vercel metis-oren-patrick-os, sans compilation. Les sources historiques Netlify restent distinctes.

## Correctif 4.2.1
Adresse Sheets officielle sheets.googleapis.com/v4 ; erreurs identifiées par service, délai maximal de requête de 20 secondes et absence de relance automatique des écritures non confirmées. Tests de routage, réseau, expiration et refus API ajoutés.

## Correctif 4.3
Chargement initial et actualisation des tâches depuis les colonnes A:Q de MATRICE MOBILE, avec priorités, statuts, échéances et temps. Conservation des tâches locales absentes du classeur. Les libellés « Ouvrir » ne sont pas transformés en faux liens. Une panne de lecture de sauvegarde Drive ne bloque plus le chargement Sheets.
