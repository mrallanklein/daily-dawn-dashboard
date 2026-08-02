# Responsive

## Paliers

| Palier | Largeur | Comportement |
| --- | --- | --- |
| Mobile | < 768 px | Barre latérale masquée, navigation basse, une colonne |
| Compact / tablette | 768 – 1023 px | Barre latérale repliée par défaut, lecture mail en modale |
| Bureau | ≥ 1024 px | Barre latérale dépliable, panneaux latéraux disponibles |
| Large | ≥ 1440 px | Grilles multi-colonnes complètes |

Le palier « compact » (< 1024 px) est la référence commune mobile + tablette pour
les comportements de lecture en modale.

## Règles

- Les en-têtes de page empilent titre et actions en dessous de 768 px : aucun
  chevauchement du titre et des boutons.
- La barre de contrôles secondaires est masquée derrière un chevron sur mobile
  pour ne pas occuper l'écran.
- Le calendrier en vue Année est limité à 5 colonnes de mois maximum.
- Les vues denses (kanban, table, Gantt) défilent horizontalement plutôt que de
  compresser leurs colonnes.
- Les panneaux latéraux deviennent des feuilles superposées en dessous de
  1024 px.
- Cibles tactiles suffisamment grandes et espacées sur mobile.