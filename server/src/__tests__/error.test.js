import errorService from '../services/error'
import { createStrapiMock } from '../__mocks__/strapi'

describe('error service', () => {
  const strapi = createStrapiMock({})
  const service = errorService({ strapi })

  it('returns a MeiliSearchApiError payload with link.url only (no label)', async () => {
    const err = new Error('Bad credentials')
    err.link = 'https://www.meilisearch.com/docs'
    err.stack = 'MeiliSearchApiError: something bad'

    const res = await service.createError(err)

    expect(res).toEqual({
      error: {
        message: 'Bad credentials',
        link: { url: 'https://www.meilisearch.com/docs' },
      },
    })
  })
})
