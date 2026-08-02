# Refonte « niveau Notion » — plan par lots

Le design actuel (couleurs, polices, icônes, cartes, mode clair/sombre) est conservé
tel quel. Tout ce qui suit s'ajoute par-dessus. La demande représente plusieurs jours
de travail : elle est découpée en 6 lots livrables l'un après l'autre, chacun
utilisable immédiatement.

## Lot 1 — Navigation, accueil, notifications

- Sidebar : bouton **Accueil** (maison Notion, assombrissement au clic) juste sous le
  switcher d'espace, puis sur la même ligne la **cloche de notifications** et la
  **recherche universelle** (⌘K).
- Cloche : badge rouge avec compteur, panneau déroulant, onglets Toutes / Non lues /
  Mentions, « Tout marquer comme lu », notification cliquable qui ouvre l'élément.
  Sources : deadlines à 24 h et 1 h, nouveaux mails Gmail, tâches assignées/modifiées,
  commentaires de projet, invitations calendrier.
- Page **Accueil** réordonnée : bannière + icône et nom de l'espace, puis « Bonjour
  Allan » avec la météo cliquable (ville des paramètres, icônes colorées, lien Google),
  puis planning + derniers mails à droite, puis Mes projets du jour et Tâches du jour,
  puis chronologie des deadlines, puis liste de tâches, puis calendrier.
- L'ancienne notion de « Dashboard » disparaît : l'accueil est cette page.

## Lot 2 — Paramètres d'espace de travail

- **Préférences régionales** : langue (FR/EN/ES), format de nombre, premier jour de la
  semaine, format de date, fuseau horaire, détection automatique par géolocalisation.
  Ces réglages sont réellement appliqués aux dates, nombres et calendriers de l'app.
- **Import de données** : CSV, PDF, TXT/MD, HTML, DOCX, chacun avec modal d'aperçu et
  mapping de colonnes vers une base existante.
- **Émojis de l'espace** : grille des emojis utilisés + ajout d'un emoji personnalisé
  (upload PNG/SVG) réutilisable comme icône de page ou de vue.
- **Zone de danger** : suppression complète de l'espace avec double confirmation par
  saisie du nom.
- **Raccourcis clavier** : page dédiée permettant de créer et modifier ses raccourcis.

## Lot 3 — Moteur de vues universel

Une brique unique réutilisée par Projets, Tâches, CRM, Budget, Équipe et les futures
pages :

- Barre d'outils : `+ Nouvelle vue`, onglets de vues, puis Filtre, Trier, Recherche,
  ··· Paramètres, Ouvrir en page entière, `+ Nouveau`.
- 6 dispositions : Table, Kanban, Calendrier, Chronologie, Galerie, Liste.
- Sélecteur d'éléments par page : 10 / 25 / 50 / 100 / Sans limite.
- Gestion des vues : création (nom, emoji, disposition), renommer, dupliquer, masquer,
  supprimer, réordonner les onglets par glisser-déposer, « Gérer les vues ».
- Densité d'affichage : compact / confortable / spacieux.
- Partage de vue : lien public en lecture seule.

Les vues sont enregistrées en base (par espace et par module), donc persistantes.

## Lot 4 — Propriétés, filtres, tris, couleurs

- **Propriétés personnalisées** sur chaque base : texte, titre, nombre (brut, devise,
  pourcentage), sélection, sélection multiple, état, case à cocher, personne, date
  (simple / période / heure), créé le, créé par, modifié le, modifié par, fichiers,
  URL, email, téléphone, relation, rollup, formule, identifiant auto, bouton, lieu.
- Éditeur de propriété : nom, type, options colorées (palette Notion : gris, marron,
  orange, jaune, vert, bleu, violet, rose, rouge), format des nombres, éditeur de
  formule avec auto-complétion, affichage/masquage, suppression confirmée.
- **Filtres** empilables (propriété, opérateur adapté au type, valeur) avec ET / OU.
- **Tris** empilables réordonnables par glisser-déposer.
- **Couleurs conditionnelles** : règles listées et réordonnables, palette douce.

## Lot 5 — Pages dynamiques et sidebar éditable

- `+ Ajouter une page` : nom, emoji, type (page vide, base de données, template) ;
  les pages créées apparaissent dans la sidebar et utilisent le moteur du lot 3.
- Réorganisation des modules par glisser-déposer, menu contextuel Renommer / Déplacer /
  Masquer / Supprimer.
- Entrée **Stratégie** réservée, visuellement désactivée, badge « Bientôt disponible ».

## Lot 6 — Fiches détail et collaboration

- Fiche détail de toute entrée (projet, tâche, contact, transaction) ouvrable en
  panneau latéral, modale centrée ou page entière, avec éditeur de blocs : texte,
  titres, listes, images, code, séparateurs.
- **Historique des modifications** par entrée : qui, quoi, quand, avec restauration
  d'une version.
- **Mentions `@`** dans commentaires et descriptions : membre (notifié), date (deadline
  ou rappel), ou lien vers un projet / une tâche / n'importe quel élément.
- **Fil d'Ariane** en haut des pages ouvertes (ex. Projets › Projet Alpha › Tâche 3).
- États vides soignés et squelettes de chargement sur tous les modules.

## Détails techniques

- Nouvelles tables Lovable Cloud : `notifications`, `views`, `view_properties` (ou
  `properties` + `view_config`), `pages`, `entry_history`, `mentions`, `workspace_emojis`,
  plus les préférences régionales et les raccourcis sur `spaces` / `profiles`.
  Chaque table est protégée par RLS scopée sur l'utilisateur, avec les GRANT nécessaires.
- Les propriétés personnalisées sont stockées en JSONB par entrée pour éviter une
  migration de schéma à chaque nouvelle propriété.
- Le moteur de vues est un composant générique (`src/components/views/`) piloté par une
  description de base (colonnes, types, accès aux données) déclarée une fois par module.
- Aucun changement du design system : tokens de `src/styles.css`, Cabinet Grotesk +
  Satoshi, icônes Lucide, pas de gradient, pas de bordure colorée sur les cartes.
- La documentation `docs/` est mise à jour à chaque lot (architecture / features / ux).

## Ordre de livraison proposé

Lot 1, puis 3, puis 4, puis 2, 5 et 6 — le moteur de vues et les propriétés sont la
colonne vertébrale du reste ; je peux commencer par un autre lot si tu préfères.
