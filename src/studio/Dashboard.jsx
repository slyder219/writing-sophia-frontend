import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import AccountTab from './AccountTab'
import CategoriesTab from './CategoriesTab'
import ManageTab from './ManageTab'
import UploadTab from './UploadTab'

const TABS = [
  { id: 'account', label: 'Account', component: AccountTab },
  { id: 'upload', label: 'Upload', component: UploadTab, editorOnly: true },
  { id: 'manage', label: 'Manage', component: ManageTab, editorOnly: true },
  { id: 'categories', label: 'Categories', component: CategoriesTab, editorOnly: true },
]

export default function Dashboard() {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('account')
  const [categories, setCategories] = useState([])

  // Shared by every editor tab so a category added anywhere shows up everywhere
  const reloadCategories = useCallback(
    () => api('/categories').then(setCategories).catch((err) => setError(err.message)),
    [],
  )

  useEffect(() => {
    api('/me')
      .then((me) => {
        setMe(me)
        if (me.is_editor) reloadCategories()
      })
      .catch((err) => setError(err.message))
  }, [reloadCategories])

  if (error) return <p className="error">{error}</p>
  if (!me) return null

  const tabs = TABS.filter((t) => !t.editorOnly || me.is_editor)
  const Active = tabs.find((t) => t.id === tab)?.component ?? AccountTab

  return (
    <section className="dashboard">
      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <Active me={me} categories={categories} reloadCategories={reloadCategories} />
    </section>
  )
}
