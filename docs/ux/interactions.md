# Interactions

## Panneaux et modales

- Une modale s'ouvre centrée, assombrit l'arrière-plan, se ferme par la croix,
  `Échap` ou clic extérieur, et ne se réouvre jamais d'elle-même après fermeture.
- Le calendrier dispose d'un panneau latéral droit : mini-calendrier,
  invitations, liste des agendas.
- La liste des agendas est masquée par défaut et se déplie par un chevron, avec
  animation de hauteur.
- Le détail d'un projet s'ouvre dans un panneau dédié depuis n'importe quelle vue.
- En affichage compact (< 1024 px), la lecture d'un mail se fait en modale
  centrée, jamais en panneau sous la liste.

## Édition

- Double-clic ou clic sur un titre : édition en ligne, `Entrée` valide, `Échap`
  annule, la perte de focus valide.
- Cocher une case est immédiat et optimiste.
- Toute mutation met à jour l'affichage sans rechargement de page ; un échec
  restaure l'état précédent et affiche une notification.

## Glisser-déposer

- Kanban projets et tâches : déplacement entre colonnes et réordonnancement dans
  une colonne. L'élément déplacé suit le curseur, la colonne cible est signalée,
  la position d'insertion est visible.
- Un dépôt hors zone valide annule le déplacement.

## Calendrier

- Clic sur une case vide : création d'événement pré-remplie avec la date.
- Sélection d'une plage horaire à la souris : création pré-remplie sur la plage.
- Glisser-déposer d'un évènement : la durée est conservée, seule la date (et
  l'heure en vue Jour / Semaine) change. La cible est surlignée pendant le survol.
- Clic sur un événement : ouverture en édition.
- Clic sur un numéro de jour : ouverture du jour en vue détaillée.
- Un événement multi-jours est rendu comme une bande continue avec son titre
  lisible sur toute la durée, répété en début de chaque semaine, tronqué
  seulement par manque réel de place.
- Le formulaire d'événement place les dates début / fin sur une ligne et les
  heures sur la ligne suivante.

## États

- **Chargement** : squelettes conservant la mise en page, jamais de saut de
  contenu : lignes pour les listes, cartes pour les grilles, grille complète
  pour le calendrier.
- **Vide** : phrase courte expliquant l'absence de contenu et action directe
  pour créer le premier élément.
  Même composant partout : titre court, phrase d'explication, action optionnelle.
- **Erreur d'intégration externe** : le module concerné indique l'échec et
  propose de réessayer ; le reste de la page reste utilisable.
- **Hors connexion / non connecté à Google** : le module invite à connecter le
  compte au lieu d'afficher une liste vide.

## Animations

- Transitions courtes et discrètes : ouverture de panneau, dépliage, apparition
  de liste en cascade légère.
- Retour au clic par enfoncement et surbrillance des contrôles.
- Aucune animation décorative sur les données ; rien qui retarde une action.