# Couleurs

Source unique : les tokens CSS de `src/styles.css`. Les composants n'utilisent
que les classes sémantiques (`bg-background`, `text-muted-foreground`,
`border-border`, `bg-brand`…). **Aucune couleur littérale** (`text-white`,
`bg-black`, `bg-[#...]`) n'est autorisée dans les composants.

## Tokens sémantiques

| Token | Rôle |
| --- | --- |
| `--background` / `--foreground` | Fond du canevas et texte principal |
| `--card` / `--card-foreground` | Surfaces de contenu |
| `--popover` / `--popover-foreground` | Surfaces flottantes |
| `--primary` / `--primary-foreground` | Action principale |
| `--secondary`, `--muted`, `--accent` | Surfaces de contrôle par niveau |
| `--muted-foreground` | Texte secondaire |
| `--border`, `--input`, `--ring` | Traits, champs, focus |
| `--destructive` | Suppression et erreur |
| `--success`, `--warning`, `--info` | Retours d'état |
| `--sidebar-*` | Jeu dédié à la barre latérale |
| `--chart-1..5` | Séries de graphiques |

## Palette clair — « papier »

Fond beige chaud `oklch(0.9731 0.0041 91)` (≈ #F7F6F3), surfaces légèrement plus
claires `oklch(0.9853 0.0029 85)`, texte `oklch(0.217 0.004 107)`. Jamais de
blanc pur ni de noir pur.

## Accents de marque

`--brand` est redéfini par la classe d'espace posée sur `<html>` :

| Espace | Classe | Accent |
| --- | --- | --- |
| ALIAS | `.ws-alias` | Teal `--teal` `oklch(0.46 0.078 192)` |
| ALLAN | `.ws-allan` | Or `--gold` `oklch(0.7846 0.1287 64)` |

Les composants utilisent `--brand` / `--brand-soft` / `--brand-foreground`, jamais
`--teal` ou `--gold` directement. L'accent est réservé aux éléments actifs et aux
actions primaires — pas de teinte de marque en aplat sur de grandes surfaces.

## Couleurs de statut

`--status-gray`, `--status-gold`, `--status-red`, `--status-purple`,
`--status-blue`, `--status-green`. L'association statut → couleur est définie une
seule fois dans `src/lib/project-status.ts` (voir
[features/projects](../features/projects.md)).

## Règles

- Pas de dégradé sur les surfaces de contenu ; seul un voile de lumière très
  discret est admis en thème clair.
- Contraste minimum AA pour tout texte, y compris le texte secondaire.
- Le mode sombre a ses propres valeurs : voir [dark-mode](./dark-mode.md).