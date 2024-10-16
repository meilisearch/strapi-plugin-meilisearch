import { MeiliSearch as Meilisearch } from 'meilisearch'
import { version } from '../../../../package.json'

/**
 * Create a Meilisearch client instance.
 *
 * @param  {object} config - Information to pass to the constructor.
 *
 * @returns { object } - Meilisearch client instance.
 */
export default config => {
  return new Meilisearch({
    ...config,
    clientAgents: [`Meilisearch Strapi (v${version})`],
  })
}
