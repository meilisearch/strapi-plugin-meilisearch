module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        entriesQuery: {
          populate: ['repeatableComponent.categories', 'categories'],
        },
      },
    },
  },
}

// The following document structure is indexed in Meilisearch
const documents = {
  id: 'restaurant-1',
  title: 'The slimmy snail',
  // ... other restaurant fields
  repeatableComponent: [
    {
      id: 1,
      title: 'my repeatable component 1',
      categories: [
        {
          id: 3,
          name: 'Asian',
          // ... other category fields
        },
        {
          id: 2,
          name: 'Healthy',
          // ... other category fields
        },
      ],
    },
  ],
}
