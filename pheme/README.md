# PHÈMÉ — migration GitHub et connexion Facebook
## État réel au 25 octobre 2026
Branche de préparation : pheme-github-facebook-20261025. Non déployée, non reliée automatiquement à Vercel.
- observatoire.html : copie de l'interface actuellement déployée, sans base de commentaires ni secrets. Elle conserve provisoirement ses appels /api/data et son affichage dix jours.
- lib/facebook.mjs : lecteur Graph API côté serveur, publications uniquement, pagination bornée, dédoublonnage, fenêtre de cinq jours calendaires Europe/Paris.
- Le connecteur n'est pas encore appelé par une route ni par l'interface. Aucun login OAuth ni stockage de jetons n'est implémenté.
- Les fonctions existantes api/data.js, api/sync.js et api/sync-comments.js ne sont PAS migrées : les réponses de récupération Vercel sont tronquées. Ne pas remplacer le déploiement actuel avec ce dossier incomplet.
## Activation Meta requise
Une application Meta autorisée est nécessaire. Pour les pages administrées : vérifier les autorisations Pages requises dans la documentation Meta et l'accès effectif à la page. Pour les pages publiques tierces (Lavalette, Massi, Préfet), un simple login utilisateur ne donne pas accès aux contenus : vérifier l'approbation Page Public Content Access, App Review et vérification d'entreprise applicables.
Documentation : https://developers.facebook.com/docs/features-reference/page-public-content-access/
Appeler readFacebookPosts côté serveur avec pageId, token et version Graph explicitement configurés. Conserver le jeton dans les variables privées Vercel. Ne jamais le publier, l'envoyer en chat ou le passer dans une URL.
Le module retourne des publications, pas des commentaires, pas une synchronisation complète. Il n'infère aucune conviction politique individuelle.
## Travail restant avant production
1. Récupérer intégralement les sources serveur existantes et le module HERMÈS.
2. Vérifier une application Meta existante ou la créer depuis un compte autorisé ; configurer consentement, confidentialité et suppression des données si OAuth retenu.
3. Ajouter une route authentifiée et un stockage privé, avec erreurs de permission explicites et date de dernière collecte réussie.
4. Raccorder les publications puis les commentaires autorisés ; conserver les données historiques séparément de la fenêtre de cinq jours.
5. Adapter l'interface aux cinq jours et à l'état réel de fraîcheur, tester sous Node et en préproduction.
6. Connecter le projet Vercel pheme-observatoire-toulon à ce sous-dossier uniquement quand la migration est complète ; préserver les domaines existants.
## Validation effectuée
Analyse syntaxique et contrôles logiques dans un environnement JavaScript isolé : dates Europe/Paris (changement d'heure et année), pagination simulée, exclusion hors fenêtre et dédoublonnage. Interfaces URL, timeout et fetch simulées. Aucun test Node, déploiement ou appel réel Meta n'a été possible.
