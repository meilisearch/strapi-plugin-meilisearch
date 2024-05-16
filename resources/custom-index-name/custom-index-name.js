// `shirts` and `pants` will be indexed in the same `products` index.
// `tops` will also be indexed in a separate `tops` index.
module.exports = () => ({
  //...
  meilisearch: {
    config: {
      shirts: {
        indexName: ['products', 'tops'],
      },
      pants: {
        indexName: ['products'],
      },
    },
  },
})
