import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadText } from '../lib/works'
import Layout from './Layout'
import useLibrary from './useLibrary'

export default function Reader() {
  const { slug } = useParams()
  const { library, error: libraryError } = useLibrary()
  const [text, setText] = useState(null)
  const [error, setError] = useState(null)

  const work = library?.works.find((w) => w.slug === slug)
  const category = library?.categories.find((c) => c.id === work?.category_id)

  useEffect(() => {
    if (!work) return
    let live = true
    loadText(slug)
      .then((t) => live && setText(t))
      .catch((err) => live && setError(err))
    return () => {
      live = false
    }
  }, [slug, work])

  useEffect(() => {
    document.title = work ? `${work.title} — Sophia Lyder` : 'Sophia Lyder'
    window.scrollTo(0, 0)
    return () => {
      document.title = 'Sophia Lyder'
    }
  }, [work])

  let body
  if (libraryError || error) body = <p className="quiet">Couldn’t load this piece. Please try again later.</p>
  else if (library && !work) body = <p className="quiet">This piece isn’t here anymore.</p>
  else if (!work) body = <p className="quiet">…</p>
  else
    body = (
      <article className="paper paper-full">
        {category && <p className="paper-category">{category.name}</p>}
        <h1>{work.title}</h1>
        <div className="paper-text">{text ?? work.excerpt}</div>
      </article>
    )

  return (
    <Layout>
      <nav className="back">
        <Link to={category ? `/?c=${category.slug}` : '/'}>← All writing</Link>
      </nav>
      {body}
    </Layout>
  )
}
