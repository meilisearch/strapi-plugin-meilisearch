# Playground

The playground is a Strapi app that uses the Meilisearch Plugin implemented in this repository.

## Database seeding

- Source of truth is `pre-seeded-database.db`. Do not modify it.
- To reset `.tmp/data.db`, run from repo root: `yarn playground:setup`.
- You can use `sqlite3` to inspect the database.

## Running the playground

- From repo root: `yarn playground:dev`.
- Strapi runs at `http://localhost:1337` using `playground/.tmp/data.db`.

## Integration test mode

- When `MEILI_RELATIONS_TEST=1` is set, bootstrap auto-indexes `api::restaurant.restaurant` into Meilisearch (used by meili-relations integration tests).
