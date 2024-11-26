/**
 * Application methods
 */
import bootstrap from './bootstrap'
import destroy from './destroy'
import register from './register'

/**
 * Plugin server methods
 */
import config from './config'
import controllers from './controllers'
import policies from './policies'
import routes from './routes'
import services from './services'

export default {
  bootstrap,
  destroy,
  register,

  config,
  controllers,
  policies,
  routes,
  services,
}
