# Mail

Route `/mail`. Boîtes Gmail multi-comptes agrégées.

## Ce que l'utilisateur peut faire

- Lire les messages des comptes activés, regroupés chronologiquement.
- Identifier le compte destinataire de chaque message.
- Ouvrir un message et lire son contenu formaté.
- Rechercher dans les messages.
- Charger plus de messages par lots.
- Rédiger et envoyer un message depuis l'un des comptes.
- Ouvrir un message directement par lien (`?msg=ID`).
- Activer / désactiver un compte pour l'espace courant depuis les réglages
  ([settings](./settings.md)).

## Règles fonctionnelles

- Le contenu HTML des messages est assaini avant affichage.
- Aucun message n'est stocké côté application
  ([architecture/sync](../architecture/sync.md)).
- Les comptes activés proviennent de `spaces.mail_accounts`.