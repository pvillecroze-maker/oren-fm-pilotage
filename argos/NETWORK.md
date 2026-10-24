# ARGOS — Constellation 3D

La vue réseau s’alimente à partir du CSV importé ou de Google Contacts autorisé dans le navigateur. Glisser pour tourner, pincement ou boutons pour zoomer, sélection d’un point ou du menu pour afficher la fiche. Flèches clavier et touches + / - disponibles.

Les organisations proviennent uniquement du champ organisation du contact. Aucun lien entre deux personnes, aucune affiliation politique et aucune opinion ne sont déduits. Les relations dirigées sont ajoutées avec une source ou un contexte, une date facultative et un statut documenté / à vérifier. Le degré affiché compte uniquement les relations documentées dans la vue filtrée ; ce n’est pas une estimation d’influence réelle.

La vue affiche au maximum 250 personnes uniques ; la recherche permet de restreindre l’ensemble. Les doublons ayant la même adresse principale sont regroupés dans le graphe. Sans adresse, l’identité utilise nom, organisation et téléphone.

Les contacts restent en mémoire pendant la session. Les relations sont conservées dans localStorage sur l’appareil. Le bouton Exporter le réseau télécharge contacts et relations dans un JSON privé ; Importer une sauvegarde les restaure. Aucun contact ou jeton Google n’est envoyé à GitHub ou au serveur Vercel. Ce fonctionnement n’est pas une synchronisation multiappareil automatique.

## Déploiement

- Dépôt : `pvillecroze-maker/oren-fm-pilotage`, branche `main`.
- Projet Vercel : `argos-network` ; Root Directory : `argos`.
- Configuration propre au sous-projet : `argos/vercel.json`.
- Installation : `npm install` ; compilation : `npm run build` ; sortie : `dist`.
- Protection Vercel conservée.
- Vérifications du modèle : `node --test tests/network.test.js`.

Le code et son fichier de verrouillage sont versionnés. Les sauvegardes personnelles ne doivent pas être ajoutées au dépôt.
