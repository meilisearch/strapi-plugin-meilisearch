// `shirts` and `pants` will be indexed in the same `products` index.
module.exports = () => ({
  //...
  meilisearch: {
    config: {
      shirts: {
        indexName: 'products',
      },
      pants: {
        indexName: 'products',
      },
    },
  },
})
