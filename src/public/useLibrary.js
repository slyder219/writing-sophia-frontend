import { useEffect, useState } from 'react'
import { loadLibrary } from '../lib/works'

export default function useLibrary() {
  const [state, setState] = useState({ library: null, error: null })

  useEffect(() => {
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
