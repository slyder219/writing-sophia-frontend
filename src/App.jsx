import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Home from './public/Home'
import Reader from './public/Reader'
import SiteBar from './SiteBar'

const Studio = lazy(() => import('./studio/Studio'))

// Shared frame: the site bar is mounted once and persists across pages
function Frame() {
  return (
    <>
      <SiteBar />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Frame />}>
        <Route path="/" element={<Home />} />
        <Route path="/w/:slug" element={<Reader />} />
        <Route
          path="/studio"
          element={
            <Suspense fallback={null}>
              <Studio />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
