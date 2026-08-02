# Mode sombre

Activé par la classe `.dark` sur `<html>`. Même structure de tokens que le thème
clair ([colors](./colors.md)), valeurs propres.

## Principes

- Gris neutres, aucune teinte parasite.
- Hiérarchie par luminosité croissante : fond < barre latérale < carte <
  popover < contrôles.
- Rendu à plat : aucune ombre, aucun dégradé, aucun voile lumineux, aucun flou de
  verre. Les surfaces sont opaques.
- Ni noir absolu ni aplat uniforme : les surfaces doivent se distinguer sans
  effort.

## Valeurs

| Token | Valeur |
| --- | --- |
| `--background` | `oklch(0.17 0 0)` |
| `--sidebar` | `oklch(0.205 0 0)` |
| `--card` | `oklch(0.225 0 0)` |
| `--popover` | `oklch(0.25 0 0)` |
| `--muted` | `oklch(0.305 0 0)` |
| `--secondary` | `oklch(0.315 0 0)` |
| `--accent` | `oklch(0.355 0 0)` |
| `--foreground` | `oklch(0.975 0 0)` |
| `--muted-foreground` | `oklch(0.78 0 0)` |
| `--border` | `oklch(1 0 0 / 0.18)` |
| `--input` | `oklch(1 0 0 / 0.3)` |
| `--elev-1..4`, `--sheen`, `--ambient` | `none` |

Accents et statuts sont désaturés-éclaircis pour rester lisibles sur fond sombre
(`--gold: oklch(0.78 0.15 58)`, `--teal: oklch(0.68 0.1 190)`).

## Contrôles

Boutons, champs et barres segmentées reposent sur `--secondary` / `--accent` :
ils doivent être nettement plus clairs que le fond et immédiatement
identifiables. Un contrôle qui se confond avec le fond est un défaut.

## Bascule

Trois modes : clair, sombre, automatique. Le comportement de bascule et sa
plage horaire sont décrits dans [features/settings](../features/settings.md).