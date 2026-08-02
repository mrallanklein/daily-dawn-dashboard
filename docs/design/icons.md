# Icônes

## Règles

- Style Notion : trait fin, contour, monochrome.
- Bibliothèque : `lucide-react`, `strokeWidth={1.5}`, taille 20 px par défaut,
  24 px dans la barre latérale repliée, 16 px dans les lignes denses.
- Couleur héritée du texte (`currentColor`) ; l'accent de marque n'est utilisé
  que pour l'élément actif.
- Les icônes de section propriétaires (Projets, Tâches, Calendrier, Mail,
  Contacts, Budget) vivent dans `src/components/icons/notion-icons.tsx` — source
  unique, jamais recopiées en SVG inline dans une page.
- Les icônes météo sont l'exception colorée assumée.
- Une icône seule doit toujours porter un libellé accessible.
- Pas d'emoji dans l'interface.