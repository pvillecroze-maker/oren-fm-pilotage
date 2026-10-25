# ARGOS — Répertoire relationnel

Module ARGOS indépendant, au sein du dépôt OREN FM.

## Objectif
Annuaire relationnel avec recherche, catégories, professions, coordonnées et liens professionnels, accessible depuis MÉTIS.

## Confidentialité
**Ce dépôt est public.** Ne jamais committer les exports CSV/VCF, coordonnées personnelles, photos privées, jetons ou données de contacts. Les données doivent résider dans un stockage privé authentifié, avec contrôle d'accès et gestion des suppressions.

## Statut
Structure initiale créée. Interface, authentification, base privée, importation et déploiement restent à développer.

## Flux des projets OREN

Le panneau « Activité des projets OREN » reçoit un instantané local de MÉTIS
(tâches, rendez-vous et métadonnées de courriels) et les tâches HERMÈS conservées
sous `metis:tasks:v1`. Il ne lit pas directement Google Drive ni toutes les données
du compte. Synchroniser MÉTIS avant le transfert. OLYMPOS et PHÈMÉ ne sont pas
raccordés ; aucun contenu n'est inventé pour ces sources.

Le bouton ouvre `/argos-feed.html` sur le domaine MÉTIS. La transmission exige
un clic explicite, une origine exacte, la fenêtre attendue et un nonce expirant
après cinq minutes. Le schéma exclut corps de courriels, notes libres et jetons.
Les données restent dans le navigateur ARGOS (`argos:oren-feed:v1`). Chaque
import remplace l'instantané précédent après validation et écriture réussie ;
les contacts et relations ne sont pas modifiés. Les activités ne constituent pas
des relations entre personnes et ne modifient pas le graphe.

Si la fenêtre est bloquée, ouvrir la page de transfert sur MÉTIS, télécharger
le flux JSON puis l'importer dans ARGOS. Ce fichier contient des métadonnées
privées : le conserver hors du dépôt. Il permet aussi un transfert manuel entre
appareils. La sauvegarde réseau existante ne contient pas ce flux séparé.

Tests : `node --test argos/tests/*.test.js metis/tests/*.test.cjs` depuis la racine.
