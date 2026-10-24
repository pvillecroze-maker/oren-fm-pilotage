# MÉTIS V4 — activation Google

Le module est codé. Il reste à configurer le projet Google avant toute connexion réelle.

1. Dans https://console.cloud.google.com/ créer ou sélectionner un projet.
2. Activer Google Calendar API, Gmail API et Google Drive API et Google Sheets API.
3. Dans Google Auth Platform, configurer le consentement et ajouter ton compte Google aux utilisateurs de test si l'application est en mode test.
4. Créer un client OAuth « Application Web ».
5. Ajouter l'origine JavaScript autorisée exacte : https://metis-oren-patrick-os.vercel.app (et l'autre domaine Vercel si utilisé).
6. Copier uniquement l'identifiant client PUBLIC (terminé par apps.googleusercontent.com) dans MÉTIS > Configurer Google. Aucun secret client n'est nécessaire pour ce flux navigateur.
7. Appuyer sur Connecter Google et autoriser les trois accès.

Fonctionnement : Agenda principal du jour, 30 courriels de boîte de réception de moins de 14 jours, sauvegarde privée des tâches dans appDataFolder. Actualisation toutes les 60 secondes tant que l'application est visible et que le jeton est valide. Après expiration ou fermeture, une reconnexion peut être nécessaire. Pas de synchronisation en arrière-plan iPhone. Les statuts du classeur MÉTIS sont lus et écrits ; les autres champs restent locaux. Les courriels restent à examiner et ne sont pas automatiquement classés comme tâches urgentes.

Conflits : la première connexion propose de charger la sauvegarde distante en conservant une copie locale de secours. Si deux appareils ont modifié les données, la synchronisation s'arrête au lieu de choisir une version silencieusement. Exporter les données locales avant résolution.

Vérification effectuée : syntaxe JavaScript ; comportements sans OAuth, session expirée et configuration invalide. Le parcours Google réel et la synchronisation entre deux appareils nécessitent l'activation ci-dessus et restent à tester. La vérification visuelle automatisée n'a pas pu être exécutée dans cet environnement.

Documentation :
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/workspace/drive/api/guides/appdata
