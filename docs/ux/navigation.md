# Navigation

Comportement uniquement. Aucune valeur graphique ici (voir [design](../design/)).

## Structure

- Barre latérale gauche persistante : sélecteur d'espace, ligne horizontale
  Accueil / Boîte / Recherche, puis les sections Projets, Tâches, Calendrier,
  Mail, Contacts, Budget, Équipe. Profil en bas.
- Zone de contenu à droite avec un en-tête de page standardisé (bannière, icône,
  titre, actions).

## Routes

| Route | Page |
| --- | --- |
| `/` | Accueil |
| `/projets` | Projets |
| `/taches` | Tâches |
| `/calendrier` | Calendrier |
| `/mail` | Mail |
| `/crm` | Contacts |
| `/budget` | Budget |
| `/equipe` | Équipe |

Toutes les pages sont sous authentification ; un utilisateur non connecté est
redirigé vers l'écran de connexion.

## Règles

- La barre latérale se replie et se déplie ; l'état est mémorisé entre sessions.
- Le bouton de bascule est un contrôle circulaire flottant placé au bord
  extérieur de la barre, toujours atteignable, replié comme déplié.
- L'élément de navigation actif est signalé en permanence.
- Changer d'espace conserve la page courante et recharge son contenu.
- Le changement de vue à l'intérieur d'une page ne change pas de route.
- Les ancres ne servent qu'au défilement interne : une section de contenu
  distincte est toujours une route.