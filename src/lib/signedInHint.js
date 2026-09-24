// Remembers that this browser has signed in, so public pages only load the
// auth SDK (to show the editor bar) for people who might have a session.
const KEY = 'ws.signedIn'

export function hasSignedInHint() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setSignedInHint(signedIn) {
  try {
    if (signedIn) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the editor bar just won't appear on public pages
  }
}
