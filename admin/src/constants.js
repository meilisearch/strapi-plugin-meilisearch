export const PERMISSIONS = {
  // This permission regards the main component (App) and is used to tell
  // If the plugin link should be displayed in the menu
  // And also if the plugin is accessible. This use case is found when a user types the url of the
  // plugin directly in the browser
  main: [
    { action: 'plugin::meilisearch.read', subject: null },
    { action: 'plugin::meilisearch.collections.create', subject: null },
    { action: 'plugin::meilisearch.collections.update', subject: null },
    { action: 'plugin::meilisearch.collections.delete', subject: null },
    { action: 'plugin::meilisearch.settings.edit', subject: null },
  ],
  collections: [
    { action: 'plugin::meilisearch.read', subject: null },
    { action: 'plugin::meilisearch.collections.create', subject: null },
    { action: 'plugin::meilisearch.collections.update', subject: null },
    { action: 'plugin::meilisearch.collections.delete', subject: null },
  ],
  settings: [
    { action: 'plugin::meilisearch.read', subject: null },
    { action: 'plugin::meilisearch.settings.edit', subject: null },
  ],
  read: [{ action: 'plugin::meilisearch.read', subject: null }],
  create: [{ action: 'plugin::meilisearch.collections.create', subject: null }],
  update: [{ action: 'plugin::meilisearch.collections.update', subject: null }],
  delete: [{ action: 'plugin::meilisearch.collections.delete', subject: null }],
  settingsEdit: [
    { action: 'plugin::meilisearch.settings.edit', subject: null },
  ],
  createAndDelete: [
    { action: 'plugin::meilisearch.collections.create', subject: null },
    { action: 'plugin::meilisearch.collections.delete', subject: null },
  ],
}
