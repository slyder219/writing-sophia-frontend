import { useEffect, useState } from 'react'
import { cachedLibrary, loadLibrary } from '../lib/works'

export default function useLibrary() {
  const [state, setState] = useState(() => ({ library: cachedLibrary(), error: null }))

  useEffect(() => {
    if (state.library) return
    let live = true
    loadLibrary()
      .then((library) => live && setState({ library, error: null }))
      .catch((error) => live && setState({ library: null, error }))
    return () => {
      live = false
    }
  }, [])

  return state
}
