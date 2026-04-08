import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

/**
 * Create an isolated temporary SQLite location for a test suite.
 *
 * @returns {Promise<{dirPath: string, dbPath: string}>} Temporary directory and DB file path.
 */
export async function createTemporaryDatabasePath() {
  const dirPath = await fs.mkdtemp(
    path.join(os.tmpdir(), 'meili-strapi-tests-'),
  )
  const dbPath = path.join(dirPath, 'data.db')

  return { dirPath, dbPath }
}

/**
 * Remove a temporary directory created for test databases.
 *
 * @param {object} options
 * @param {string|null|undefined} options.dirPath - Directory path to remove.
 *
 * @returns {Promise<void>}
 */
export async function removeTemporaryDatabasePath({ dirPath }) {
  if (!dirPath) return

  await fs.rm(dirPath, { recursive: true, force: true })
}
