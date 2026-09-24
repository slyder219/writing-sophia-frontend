import { Link, useSearchParams } from 'react-router-dom'
import Layout from './Layout'
import useLibrary from './useLibrary'

// A tiny, stable tilt per piece so the sheets look hand-placed
function tilt(slug) {
  let hash = 0
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return ((Math.abs(hash) % 25) - 12) / 10 // -1.2° … 1.2°
}

export default function Home() {
  const { library, error } = useLibrary()
  const [params, setParams] = useSearchParams()

  if (error) return <Layout><p className="quiet">Couldn’t load the writing. Please try again later.</p></Layout>
  if (!library) return <Layout><p className="quiet">…</p></Layout>

  const { works, categories } = library
  // One tab per category that has something in it; the page opens on the first
  const tabs = categories.filter((c) => works.some((w) => w.category_id === c.id))
  const active = tabs.find((c) => c.slug === params.get('c')) ?? tabs[0]
  const shown = active ? works.filter((w) => w.category_id === active.id) : []

  const choose = (slug) => setParams({ c: slug }, { replace: true })

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
            <li key={work.slug} style={{ '--tilt': `${tilt(work.slug)}deg` }}>
              <Link to={`/w/${work.slug}`} className="paper paper-mini">
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
