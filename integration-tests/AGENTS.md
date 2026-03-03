## Integration tests

These tests require a Meilisearch server and the Strapi playground to be running.

Typical local flow (from repo root):
- Start Meilisearch
- Seed DB: `yarn playground:setup`.
- Start playground with relations mode with `MEILI_RELATIONS_TEST=1`.
- Run the test.

