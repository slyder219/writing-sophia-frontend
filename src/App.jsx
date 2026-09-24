import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './public/Home'
import Reader from './public/Reader'

const Studio = lazy(() => import('./studio/Studio'))

export default function App() {
  return (
    <Routes>
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
    </Routes>
  )
}
