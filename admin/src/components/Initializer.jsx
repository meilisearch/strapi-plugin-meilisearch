/**
 *
 * Initializer
 *
 */

import { useEffect, useRef } from 'react'

import pluginId from '../pluginId'

/**
 * @type {import('react').FC<{ setPlugin: (id: string) => void }>}
 */
const Initializer = ({ setPlugin }) => {
  const ref = useRef(setPlugin)

  useEffect(() => {
    ref.current(pluginId)
  }, [])

  return null
}

export default Initializer
