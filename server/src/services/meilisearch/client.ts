import MeiliSearch from 'meilisearch';

/**
 * Create a Meilisearch client instance.
 *
 * @param  {object} config - Information to pass to the constructor.
 *
 * @returns { object } - Meilisearch client instance.
 */


export const meilisearchClient = (config) => {
	return new Meilisearch({
		...config,
		clientAgents: ['Meilisearch Strapi (v0.13.0)'], // TODO
	})
}