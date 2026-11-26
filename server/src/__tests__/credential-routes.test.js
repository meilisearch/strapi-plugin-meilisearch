import { ACTIONS } from '../constants'
import routes from '../routes'

describe('credential routes', () => {
  it.each(['GET', 'POST'])('requires settings permission for %s', method => {
    const route = routes.find(
      route => route.method === method && route.path === '/credential',
    )

    expect(route.config.policies).toEqual([
      'admin::isAuthenticatedAdmin',
      {
        name: 'admin::hasPermissions',
        config: { actions: [ACTIONS.settings] },
      },
    ])
  })
})
