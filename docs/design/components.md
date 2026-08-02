# Composants

Base : shadcn/ui dans `src/components/ui`. Un composant partagé se personnalise
par variante, jamais par surcharge de couleur au cas par cas.

## Utilitaires du design system

Déclarés dans `src/styles.css` :

| Utilitaire | Rôle |
| --- | --- |
| `surface` | Surface de contenu standard (fond, bordure, rayon) |
| `glass` / `glass-strong` | Verre translucide : flou et grain fin (thème clair) |
| `elevate` | Application d'un niveau d'élévation |
| `press` | Retour d'enfoncement au clic |
| `soft-row` | Ligne de liste avec survol |
| `hairline` | Trait fin de séparation |
| `pill` | Forme pilule |
| `topline`, `ambient`, `glow`, `rise`, `stagger` | Effets d'ambiance et d'entrée |
| `eyebrow`, `num`, `font-accent` | Variantes typographiques |

## Cartes

Surface `--card`, rayon 20–24 px, élévation 2, padding 20–24 px. Une carte
contient un titre, un contenu et au plus une action. Les modules de tableau de
bord suivent ce modèle unique.

## Boutons

| Variante | Usage |
| --- | --- |
| `default` | Action principale (surface `--primary`) |
| `brand` | Action primaire liée à l'espace actif (`--brand`) |
| `secondary` | Action secondaire sur surface `--secondary` |
| `ghost` | Action tertiaire, barres d'outils |
| `outline` | Action sur fond coloré ou photo |
| `destructive` | Suppression |
| Icône circulaire | Bascule de barre latérale, Boîte, Recherche |

Hauteurs : 36 px par défaut, 32 px compact, 28 px dans une barre segmentée.
Tous les boutons ont un état survol, actif (enfoncement), focus visible et
désactivé.

## Contrôles segmentés

Barre en pilule (`ControlPill`, sélecteurs de vue et de période) : segments de
largeur égale en grille, séparateurs fins, segment actif surligné, hauteur 28 px,
fond translucide, contour fin. Les segments doivent rester nettement plus clairs
que le fond en thème sombre.

## Champs

Fond `--secondary` ou transparent selon le contexte, bordure `--input`,
rayon 12 px, hauteur 36 px, anneau `--ring` au focus. Libellé au-dessus, aide et
erreur en dessous. Placeholder en `--muted-foreground`.

## En-têtes de page

Modèle unique (`src/components/app/page-header.tsx`) : bannière, icône 40 px,
titre, sous-titre, actions à droite. Aucune page ne définit son propre en-tête.

## Badges et pastilles

Badge de statut : pastille de couleur + libellé, fond `--muted`, texte issu du
token de statut. Badges de compte mail : pastille colorée par compte.

## Avatars

Cercle, initiales en repli, tailles 24 / 32 / 40 / 64 px.

## Modales et menus

Surface `--popover`, élévation 4, rayon 20 px, largeur maximale 640 px pour un
formulaire, 720 px pour une lecture. Voile d'arrière-plan discret.

## Squelettes

Blocs `--muted` au rayon du composant remplacé, pulsation lente.