# Calendrier

Route `/calendrier`. Agrégation des agendas Google des comptes activés.

## Ce que l'utilisateur peut faire

- Choisir la vue : Jour, Semaine, Mois, Année.
- Naviguer période précédente / suivante, revenir à aujourd'hui, choisir un mois
  et une année.
- Cliquer un jour pour l'ouvrir en détail.
- Créer un événement : titre, description, lieu, agenda de destination, dates de
  début et de fin, heures, journée entière, invités.
- Modifier et supprimer un événement existant.
- Accepter, refuser ou marquer comme peut-être une invitation.
- Afficher ou masquer la liste de ses agendas et cocher ceux à afficher.
- Voir les invitations en attente et les traiter.

## Règles fonctionnelles

- Un événement couvrant plusieurs jours est une seule entité continue, pas un
  élément par jour.
- Les événements « journée entière » utilisent une date de fin exclusive côté
  Google, ramenée au dernier jour réel à l'affichage.
- La sélection d'agendas est mémorisée par espace
  (`spaces.calendar_ids`, voir [architecture/data-model](../architecture/data-model.md)).
- Toute création ou modification est écrite directement sur Google
  ([architecture/sync](../architecture/sync.md)).