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

## Correctif 4.3.1
La matrice masque par défaut les tâches terminées et les exclut des compteurs de quadrants. Filtres À traiter / Terminées / Toutes les tâches. Aucune suppression de données.

## 4.4 — Gmail multi-compte et Music

Dans Mails, ajouter chaque boîte Gmail séparément. Le compte connecté au panneau Google reste celui utilisé pour Sheets, Agenda et Drive. Fenêtre glissante de 30 jours, pages complètes, corps MIME texte lus, archives et envoyés inclus, spam/corbeille exclus. Les pièces jointes documentaires ne sont pas analysées. Le préclassement est une heuristique par règles, pas une analyse sémantique exhaustive ; contrôler la conversation et valider action/quadrant avant ajout dans Sheets. Les notifications Mailsuite ne remplacent pas le dernier échange humain. Un échec conserve la liste précédente et affiche une couverture incomplète. Tokens en mémoire, métadonnées locales ; aucune donnée de messagerie n'est livrée dans le dépôt. La lecture nécessite l'application ouverte et une session valide, elle n'est pas une tâche de fond serveur.

Music intègre le projet SILLAGE/MODULATION existant et ses 264 références musicales. Historique, imports/exports et sessions locaux conservés dans son propre espace de stockage. Les données d'une ancienne origine doivent être exportées depuis celle-ci puis importées. Dans Vercel, configurer en secrets serveur APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY et l'origine publique SILLAGE_PUBLIC_ORIGIN. Ne jamais publier la clé .p8. Sans ces paramètres, /api/musickit-token renvoie 503 ; la composition locale reste disponible. Une autorisation Apple Music est ensuite nécessaire pour créer une nouvelle playlist. Aucune playlist existante n'est remplacée.

Validation : `node tests/mail-sync.test.cjs`. Le test simule Gmail ; il ne constitue pas un test réel du consentement Google ou Apple sur iPhone.
