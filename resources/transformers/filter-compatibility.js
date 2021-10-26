module.exports = {
  transformEntryForMeiliSearch(entry) {
    const transformedEntry = {
      ...entry,
      categories: entry.categories.map(cat => cat.name), // map to only have categories name
    }
    return transformedEntry
  },
}
