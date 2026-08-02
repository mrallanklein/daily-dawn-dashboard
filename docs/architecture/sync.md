# Synchronisation

## Google Calendar (bidirectionnel, à la demande)

- Comptes : `primary` et `secondary`, agrégés dans une même vue.
- Les agendas affichés sont listés dans `spaces.calendar_ids`
  (`accountKey::calendarId`).
- Lecture : requête par plage de dates lors du changement de vue ou de période ;
  aucun événement n'est stocké en base.
- Écriture : création, modification, suppression et réponse aux invitations sont
  poussées directement vers Google, puis la plage courante est réinvalidée.
- Fuseaux : les événements horodatés sont convertis dans le fuseau local du
  navigateur ; les événements « journée entière » ont une date de fin exclusive
  qui est ramenée au dernier jour affiché.
- Conflit : Google est la source de vérité, la dernière écriture gagne.

## Gmail (lecture + envoi)

- Même mécanique multi-comptes ; chaque message conserve sa clé de compte
  d'origine pour l'attribution.
- Liste paginée par lots, recherche déléguée à l'API, corps HTML récupéré à
  l'ouverture et assaini avant rendu.
- Aucun message, pièce jointe ou brouillon n'est persisté côté application.

## Notion (import ponctuel)

- Sens unique : Notion → base, exécuté manuellement lors d'une reprise de
  données (projets, todolist).
- Mapping : nom Notion → `projects.name` (le préfixe `Famille - Titre` alimente
  la famille), statut Notion → statut métier, date d'échéance → `deadline`.
- Idempotence : le rapprochement se fait sur le nom normalisé ; un import répété
  met à jour au lieu de dupliquer.
- Notion n'est pas une source vivante : après import, la base est la référence.

## Météo et localisation

- Position obtenue uniquement sur action explicite (géolocalisation navigateur),
  résolue en ville puis stockée dans `spaces.weather_lat/lon/weather_city`.
- Rafraîchissement de la météo au chargement de l'accueil.

## Règles générales

- Aucune donnée externe n'est dupliquée en base sans besoin métier explicite.
- Toute synchronisation s'exécute côté serveur (voir [api](./api.md)).
- Un échec de source externe dégrade la vue concernée sans casser la page ; le
  comportement d'affichage correspondant est décrit dans [ux/interactions](../ux/interactions.md).