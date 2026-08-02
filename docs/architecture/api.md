# API et frontières serveur

## Trois chemins d'accès

1. **Client → base** : client Supabase généré, RLS appliquée comme utilisateur.
   Utilisé pour toutes les entités internes (projets, tâches, contacts, budget,
   espaces, todo).
2. **Client → server function** : `createServerFn` (@tanstack/react-start) pour
   tout ce qui nécessite un secret serveur — c'est-à-dire les intégrations
   Google. Fichiers `*.functions.ts` (importables côté client) délégant à
   `*.server.ts` (jamais importés par un composant).
3. **Externe → route serveur** : `src/routes/api/public/*` pour webhooks et
   appels planifiés. Vérification du signataire obligatoire dans le handler.

## Server functions existantes

### `src/lib/agenda.functions.ts`
| Fonction | Rôle |
| --- | --- |
| `listCalendars` | Agendas disponibles par compte |
| `getCalendarEvents` | Événements sur une plage, tous comptes activés |
| `saveCalendarEvent` | Création et mise à jour |
| `deleteCalendarEvent` | Suppression |
| `respondCalendarEvent` | Réponse à une invitation |

### `src/lib/mail.functions.ts`
| Fonction | Rôle |
| --- | --- |
| `getMailStatus` | Comptes connectés et état de l'accès |
| `listMailAccounts` | Liste des boîtes disponibles |
| `listMessages` | Liste paginée / recherche |
| `sendMessage` | Envoi |

## Règles

- Toute entrée est validée (Zod) dans `.inputValidator()`.
- Les schémas Zod vivent dans un module dédié (`*.schemas.ts`) importé par le
  fichier `*.functions.ts`, jamais déclarés à côté du handler.
- `process.env` est lu **dans** `.handler()`, jamais au niveau module.
- Un fichier `*.functions.ts` ne contient que des imports, des types et les
  déclarations de server functions ; les helpers vivent dans un module importé.
- Une server function protégée (`requireSupabaseAuth`) n'est jamais appelée
  depuis un `loader` de route publique ; les loaders protégés vivent sous
  `_authenticated/`.
- Les identifiants de comptes Google sont abstraits en clés (`primary`,
  `secondary`) : aucune adresse mail n'est codée en dur côté client.
- Météo : géocodage inverse public (Nominatim), coordonnées persistées sur
  `spaces` ; aucun appel météo authentifié.