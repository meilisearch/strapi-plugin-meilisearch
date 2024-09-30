export function isObject(elem) {
	return typeof elem === 'object' && !Array.isArray(elem) && elem !== null
  }