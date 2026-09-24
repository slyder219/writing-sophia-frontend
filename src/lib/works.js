// Public data straight from the bucket — no backend or database involved.
const WORKS_URL = import.meta.env.VITE_WORKS_URL

let libraryPromise = null

async function getJson(path) {
  const res = await fetch(`${WORKS_URL}/${path}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Couldn’t load ${path}`)
  return res.json()
}

// { works, categories }, loaded once per visit
export function loadLibrary() {
  libraryPromise ??= Promise.all([getJson('index.json'), getJson('categories.json')])
    .then(([works, categories]) => ({ works, categories }))
    .catch((err) => {
      libraryPromise = null
      throw err
    })
  return libraryPromise
}

export async function loadText(slug) {
  const res = await fetch(`${WORKS_URL}/works/${encodeURIComponent(slug)}/text.txt`)
  if (!res.ok) throw new Error('Couldn’t load this piece')
  return res.text()
}
