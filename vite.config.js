import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const origin = (url) => new URL(url).origin

// Content Security Policy for the production build. GitHub Pages can't set
// headers, so it goes in a <meta> tag. (Dev is excluded: Vite injects inline
// scripts there.)
function csp(env) {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    `connect-src 'self' ${origin(env.VITE_BACKEND_URL)} ${origin(env.VITE_NEON_AUTH_URL)} ${origin(env.VITE_WORKS_URL)}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react(), csp(env)],
  }
})
