// Remembers that this browser has signed in, so the site bar only loads the
// auth SDK for people who might have a session. Components can subscribe.
import { useSyncExternalStore } from 'react'

const KEY = 'ws.signedIn'
const listeners = new Set()

export function hasSignedInHint() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setSignedInHint(signedIn) {
  if (signedIn === hasSignedInHint()) return
  try {
    if (signedIn) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the site bar just stays empty
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSignedInHint() {
  return useSyncExternalStore(subscribe, hasSignedInHint)
}
