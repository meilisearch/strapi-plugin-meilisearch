import { RETRY_FAILED_SYNC_JOB } from './services/document-middleware/failed-sync-queue'

/**
 * Plugin destroy phase: remove the retry cron job so dev-mode reloads and
 * test runs do not leak timers. Removing a job that was never added is a no-op.
 *
 * @param  {object} options
 * @param  {object} options.strapi - Strapi instance.
 */
const destroy = ({ strapi }) => {
  strapi?.cron?.remove?.(RETRY_FAILED_SYNC_JOB)
}

export default destroy
