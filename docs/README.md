# Documentation — source de vérité

Quatre niveaux de responsabilité, strictement séparés. Une information n'existe
qu'à un seul endroit ; les autres documents y renvoient par lien.

| Niveau | Dossier | Répond à la question |
| --- | --- | --- |
| Architecture & modèle de données | [`architecture/`](./architecture/) | Comment l'application est structurée en interne |
| Fonctionnalités | [`features/`](./features/) | Ce que l'utilisateur peut faire |
| UI / UX | [`ux/`](./ux/) | Comment l'interface se comporte |
| Design System | [`design/`](./design/) | À quoi l'interface ressemble |

## Index

- [01-vision.md](./01-vision.md) — intention produit, profils, périmètre
- [02-roadmap.md](./02-roadmap.md) — état actuel et suite
- Architecture : [data-model](./architecture/data-model.md) · [relations](./architecture/relations.md) · [api](./architecture/api.md) · [sync](./architecture/sync.md)
- Features : [home](./features/home.md) · [calendar](./features/calendar.md) · [tasks](./features/tasks.md) · [projects](./features/projects.md) · [mail](./features/mail.md) · [crm](./features/crm.md) · [budget](./features/budget.md) · [settings](./features/settings.md)
- UX : [navigation](./ux/navigation.md) · [interactions](./ux/interactions.md) · [shortcuts](./ux/shortcuts.md) · [responsive](./ux/responsive.md)
- Design : [colors](./design/colors.md) · [typography](./design/typography.md) · [spacing](./design/spacing.md) · [components](./design/components.md) · [icons](./design/icons.md) · [dark-mode](./design/dark-mode.md)

## Règles de rédaction

1. **Architecture** : aucune mention de couleur, composant ou écran.
2. **Features** : aucune mention de style, d'espacement ou de composant visuel.
3. **UX** : comportement uniquement (ouverture, drag, animation, responsive, états vides). Pas de valeurs graphiques.
4. **Design System** : valeurs et règles graphiques uniquement. Toutes les pages doivent l'utiliser exclusivement — aucune couleur ni police codée en dur dans les composants.
5. Toute nouvelle fonctionnalité s'ajoute dans le document correspondant, pas dans un document généraliste.
6. En cas de doute sur l'emplacement d'une information : la donnée va dans `architecture/`, la capacité dans `features/`, le geste dans `ux/`, la valeur visuelle dans `design/`.