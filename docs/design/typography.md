# Typographie

Trois familles, exposées par tokens :

| Token | Classe | Usage |
| --- | --- | --- |
| `--font-display` | `font-display` | Titres, en-têtes de page, chiffres clés |
| `--font-body` | `font-sans` (défaut) | Texte courant, libellés, tableaux |
| `--font-accent` | `font-accent` | Kinglard, usage éditorial ponctuel |

Pile principale : SF Pro Display / SF Pro Text puis `-apple-system` et
`system-ui`. Kinglard est un serif d'accent : il ne sert jamais au texte courant
ni aux interfaces denses, sa lisibilité étant insuffisante.

## Échelle

| Rôle | Taille | Graisse | Interlignage |
| --- | --- | --- | --- |
| Titre de page | 30–34 px | 600 | 1.1 |
| Titre de section | 20–22 px | 600 | 1.2 |
| Titre de carte | 16–17 px | 600 | 1.3 |
| Texte courant | 15 px | 400–500 | 1.5 |
| Secondaire / méta | 13 px | 450 | 1.45 |
| Surtitre (`eyebrow`) | 11 px | 600, majuscules, interlettrage +0.08em | 1 |

## Règles

- Un seul `h1` par page, hiérarchie de titres continue.
- Les libellés d'interface sont en 15 px medium : privilégier la lisibilité à la
  finesse.
- Les chiffres utilisent l'utilitaire `num` (chiffres tabulaires) dans les
  tableaux et indicateurs.
- Pas de texte inférieur à 11 px, pas de majuscules sur plus de trois mots.
- Les titres tronqués utilisent l'ellipse, jamais la coupe brutale.