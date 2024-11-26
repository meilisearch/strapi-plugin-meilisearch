function isObject(elem) {
  return typeof elem === 'object' && !Array.isArray(elem) && elem !== null
}

export { isObject }
