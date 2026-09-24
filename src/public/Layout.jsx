import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="site">
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
