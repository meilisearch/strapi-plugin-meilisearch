const mockToggleNotification = jest.fn()
const mockI18n = jest.fn(
  (id, defaultMessage) => `t:${id}:${defaultMessage ?? ''}`,
)

jest.mock('@strapi/strapi/admin', () => ({
  useNotification: () => ({ toggleNotification: mockToggleNotification }),
}))

jest.mock('../useI18n', () => ({
  useI18n: () => ({ i18n: mockI18n }),
}))

const { useAlert } = require('../useAlert')

describe('useAlert.handleNotification', () => {
  beforeEach(() => {
    mockToggleNotification.mockClear()
    mockI18n.mockClear()
    global.localStorage = {
      setItem: jest.fn(),
    }
  })

  it('normalizes a link label descriptor to a translated string', () => {
    const { handleNotification } = useAlert()

    const link = {
      url: 'https://www.meilisearch.com/docs',
      label: { id: 'meilisearch.some.label', defaultMessage: 'See more default' },
    }

    handleNotification({
      message: 'Boom',
      link,
    })

    expect(mockToggleNotification).toHaveBeenCalledTimes(1)
    const payload = mockToggleNotification.mock.calls[0][0]
    expect(payload.link.label).toBe('t:some.label:See more default')
  })

  it('adds a translated label when only url is provided', () => {
    const { handleNotification } = useAlert()

    handleNotification({
      message: 'Boom',
      link: { url: 'https://www.meilisearch.com/docs' },
    })

    expect(mockToggleNotification).toHaveBeenCalledTimes(1)
    const payload = mockToggleNotification.mock.calls[0][0]
    expect(payload.link.label).toBe(
      't:plugin.message.error.meilisearchDocsLink:See more',
    )
  })

  it('keeps working without a link', () => {
    const { handleNotification } = useAlert()

    handleNotification({
      message: 'Boom',
    })

    expect(mockToggleNotification).toHaveBeenCalledTimes(1)
    const payload = mockToggleNotification.mock.calls[0][0]
    expect(payload.link).toBeUndefined()
    expect(payload.message).toBe('t:notification.meilisearch.message:Boom')
  })
})
