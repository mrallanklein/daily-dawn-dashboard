# Espacements, rayons, ombres

## Grille

Base 4 px. Échelle utilisée : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

| Contexte | Valeur |
| --- | --- |
| Padding interne de carte | 20–24 px |
| Gouttière entre cartes | 16–20 px |
| Espace entre sections | 32 px |
| Sous le titre d'accueil | 32 px |
| Entre bannière et titre d'en-tête | 24 px |
| Padding horizontal de page | 24 px (mobile 16 px) |
| Hauteur de ligne de liste | 40–44 px |

## Rayons

`--radius: 1.25rem` (20 px) comme base ; l'échelle Tailwind dérive
`sm`/`md`/`lg`/`xl`/`2xl`/`3xl`.

| Élément | Rayon |
| --- | --- |
| Carte, panneau, modale | 20–24 px |
| Champ, bouton, contrôle | 12 px |
| Pilule, badge, bouton circulaire | complet |
| Case à cocher | 6 px |

## Élévation

Quatre niveaux : `--elev-1` à `--elev-4`, exposés par `shadow-xs`,
`shadow-soft`, `shadow-lift`, `shadow-float`.

| Niveau | Usage |
| --- | --- |
| 1 | Trait de séparation d'une surface au repos |
| 2 | Carte au repos |
| 3 | Carte survolée, panneau |
| 4 | Modale, menu, popover |

En thème sombre, toutes les élévations valent `none` : la hiérarchie se fait par
la luminosité des surfaces ([dark-mode](./dark-mode.md)).

## Traits

Les séparations utilisent `border-border` en 1 px ou l'utilitaire `hairline`.
Une carte n'a jamais à la fois une ombre forte et une bordure marquée.