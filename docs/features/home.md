# Accueil

Route `/`. Résumé de la journée pour l'espace actif.

## Ce que l'utilisateur peut faire

- Lire une salutation personnalisée (« Bonjour Allan ») avec son identité d'espace.
- Consulter la météo de sa position et l'ouvrir en détail sur un service externe.
- Déclencher la détection de sa position pour définir la ville météo (repli
  automatique sur la localisation par IP si le navigateur refuse), ou saisir une
  ville dans les réglages de l'espace.
- Voir un état de chargement puis, en cas d'échec, un bouton « Météo
  indisponible — cliquer pour réessayer ».
- Consulter l'agenda du jour (tous les agendas activés), ouvrir un aperçu centré
  des détails d'un événement puis passer en modification depuis cet aperçu.
- Créer un événement depuis le bouton « + » circulaire en bas à droite du module
  Planning.
- Consulter les tâches à faire et les cocher directement.
- Consulter les projets de la période avec leur statut et leur échéance.
- Changer la période affichée : 1 jour, 3 jours, 7 jours, et plus.
- Consulter la liste chronologique des prochaines échéances.
- Écrire, cocher, dater, ordonner et imbriquer des éléments de todo libre.
- Parcourir un mini-calendrier du mois et sauter à une date.
- Lire un aperçu des derniers mails, en charger 5 de plus, en ouvrir un, et
  rechercher dans la boîte.
- Basculer d'espace et ouvrir les réglages depuis l'avatar.

## Règles fonctionnelles

- La période choisie s'applique conjointement aux tâches et aux projets.
- Un événement long en cours est classé sous « Aujourd'hui » et non à sa date de
  départ.
- Le module Planning s'adapte à son contenu et ne s'étire pas quand la période
  contient peu d'événements.
- Les éléments sans date n'apparaissent pas dans les échéances.
- La todo libre est indépendante des projets et des tâches
  ([architecture/data-model](../architecture/data-model.md)).
- Une intégration Google non connectée masque le module concerné plutôt que
  d'afficher une erreur.