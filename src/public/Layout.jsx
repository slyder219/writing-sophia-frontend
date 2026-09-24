import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { hasSignedInHint } from '../lib/signedInHint'

const EditorBar = lazy(() => import('./EditorBar'))

export default function Layout({ children }) {
  return (
    <div className="site">
      {hasSignedInHint() && (
        <Suspense fallback={null}>
          <EditorBar />
        </Suspense>
      )}
      <header className="site-header">
        <Link to="/" className="site-name">
          Sophia Lyder
        </Link>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <Link to="/studio">Studio</Link>
      </footer>
    </div>
  )
}
