# CRM

Routes `/crm` (contacts) et `/equipe` (membres).

## Contacts

- Créer, modifier, supprimer un contact : nom, société, fonction, email,
  téléphone, pays, source, statut, étiquettes, notes.
- Enregistrer une interaction (type, contenu, date).
- Suivre la date du dernier contact.
- Rechercher, filtrer par statut / étiquette / société, trier.
- Lier un contact à un projet en tant que client
  ([projects](./projects.md)).

## Équipe

- Inviter / créer un membre : nom, email, fonction, permission, statut, avatar.
- Modifier ou retirer un membre.
- Affecter un membre à un projet et à une tâche.

## Règles fonctionnelles

- Contacts et membres sont cloisonnés par espace.
- Supprimer un contact ne supprime pas les projets associés ; le lien client est
  simplement retiré ([architecture/relations](../architecture/relations.md)).