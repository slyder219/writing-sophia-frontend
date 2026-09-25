import { useLayoutEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from './Layout'
import useLibrary from './useLibrary'

// A tiny, stable tilt per piece so the sheets look hand-placed
function tilt(slug) {
  let hash = 0
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return ((Math.abs(hash) % 25) - 12) / 10 // -1.2° … 1.2°
}

// The piece named in the URL's #, if any (a malformed # is simply ignored)
function fromHash(hash) {
  try {
    return decodeURIComponent(hash.slice(1))
  } catch {
    return ''
  }
}

export default function Home() {
  const { library, error } = useLibrary()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [lit, setLit] = useState(null)

  // Coming back from a piece (#slug): open the page already where the reader left
  // it — before the browser paints, so nothing visibly scrolls — and briefly light
  // up the sheet they had open.
  const from = fromHash(location.hash)
  const ready = Boolean(library)
  useLayoutEffect(() => {
    if (!from || !ready) return
    const sheet = document.querySelector(`[data-slug="${CSS.escape(from)}"]`)
    if (!sheet) return
    const top = location.state?.sheetTop
    if (typeof top === 'number') window.scrollTo(0, window.scrollY + sheet.getBoundingClientRect().top - top)
    else sheet.scrollIntoView({ block: 'center' })
    setLit(from)
    const t = setTimeout(() => setLit(null), 1600)
    return () => clearTimeout(t)
  }, [from, ready, location.key])

  if (error) return <Layout><p className="quiet">Couldn’t load the writing. Please try again later.</p></Layout>
  if (!library) return <Layout><p className="quiet">…</p></Layout>

  const { works, categories } = library
  // One tab per category that has something in it; the page opens on the first
  const tabs = categories.filter((c) => works.some((w) => w.category_id === c.id))
  const active = tabs.find((c) => c.slug === params.get('c')) ?? tabs[0]
  const shown = active ? works.filter((w) => w.category_id === active.id) : []

  const choose = (slug) => setParams({ c: slug }, { replace: true })

  // Mark this list entry with the piece being opened (and where its sheet sat on
  // screen), so the browser back button and "All writing" both return right here
  const open = (e, slug) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const sheetTop = e.currentTarget.getBoundingClientRect().top
    navigate({ search: location.search, hash: slug }, { replace: true, state: { sheetTop } })
  }

  return (
    <Layout>
      {tabs.length > 0 && (
        <nav className="category-tabs" aria-label="Categories">
          {tabs.map((c) => (
            <button key={c.id} className={active.id === c.id ? 'active' : ''} onClick={() => choose(c.slug)}>
              {c.name}
            </button>
          ))}
        </nav>
      )}

      {shown.length === 0 ? (
        <p className="quiet">Nothing here yet.</p>
      ) : (
        <ul className="papers">
          {shown.map((work) => (
            <li
              key={work.slug}
              data-slug={work.slug}
              className={lit === work.slug ? 'lit' : undefined}
              style={{ '--tilt': `${tilt(work.slug)}deg` }}
            >
              <Link
                to={`/w/${work.slug}`}
                state={{ fromList: true }}
                className="paper paper-mini"
                onClick={(e) => open(e, work.slug)}
              >
                <h2>{work.title}</h2>
                <p className="paper-text">{work.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  )
}
