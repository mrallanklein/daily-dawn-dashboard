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
- Météo : tous les appels externes passent par des fonctions serveur
  (`src/lib/weather.functions.ts`), jamais par le navigateur — ce qui évite les
  blocages CORS / iframe :
  - `fetchWeather({ lat, lon })` → Open-Meteo (température, code, min/max du
    jour), avec repli automatique sur MET Norway si Open-Meteo échoue (quota
    quotidien dépassé, indisponibilité) et cache serveur de 15 min ; le dernier
    résultat connu est réutilisé plutôt que d'afficher une erreur.
  - `searchPlaces({ query })` → géocodage Open-Meteo pour la saisie de ville.
  - `reverseGeocode({ lat, lon })` → Nominatim (avec `User-Agent`).
  - `locateByIp()` → repli approximatif via l'IP de la requête quand la
    géolocalisation navigateur est refusée ou indisponible.
  Coordonnées persistées sur `spaces` (`weather_city`, `weather_lat`, `weather_lon`).