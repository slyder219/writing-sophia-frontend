// Public data straight from the bucket — no backend or database involved.
const WORKS_URL = import.meta.env.VITE_WORKS_URL

let libraryPromise = null
let library = null

async function getJson(path) {
  const res = await fetch(`${WORKS_URL}/${path}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Couldn’t load ${path}`)
  return res.json()
}

// { works, categories }, loaded once per visit
export function loadLibrary() {
  libraryPromise ??= Promise.all([getJson('index.json'), getJson('categories.json')])
    .then(([works, categories]) => (library = { works, categories }))
    .catch((err) => {
      libraryPromise = null
      throw err
    })
  return libraryPromise
}

// The library if it has already loaded, so pages can render it on the first pass
export function cachedLibrary() {
  return library
}

export async function loadText(slug) {
  const res = await fetch(`${WORKS_URL}/works/${encodeURIComponent(slug)}/text.txt`)
  if (!res.ok) throw new Error('Couldn’t load this piece')
  return res.text()
}
