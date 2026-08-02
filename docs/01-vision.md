# Vision

Poste de travail unique pour piloter l'activité d'Allan Klein : agenda, tâches,
projets, mails, contacts et budget dans une seule application, sans passer par
Notion, Gmail et Google Calendar séparément.

## Profils (espaces)

L'application est multi-espaces. Deux espaces de référence :

- **ALIAS** — activité entreprise.
- **ALLAN KLEIN** — activité personnelle / freelance.

Un espace porte son identité (nom, avatar, bannière), ses comptes mail, ses
agendas et sa localisation météo. Toutes les données métier sont cloisonnées par
espace (voir [architecture/data-model](./architecture/data-model.md)).

## Principes produit

- **Un seul point d'entrée** : la page d'accueil résume la journée.
- **Le projet est l'unité centrale** ; les tâches sont ses sous-éléments.
- **Données externes en lecture/écriture** : Google Calendar et Gmail sont
  pilotés depuis l'application, pas seulement consultés.
- **Multi-vues plutôt que multi-pages** : une même donnée se consulte en liste,
  tableau, kanban, timeline ou calendrier.
- **Application de bureau** : densité, raccourcis clavier, navigation au clavier,
  qualité macOS.

## Hors périmètre (v1)

Collaboration temps réel multi-utilisateurs, facturation, application mobile
native, automatisations serveur planifiées.