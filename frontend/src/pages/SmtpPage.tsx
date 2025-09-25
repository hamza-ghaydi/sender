import { useEffect, useState } from 'react'
import { api } from '../api'
import '../ui/layout.css'

type Profile = {
  id: string
  name: string
  host: string
  port: number
  user: string
  pass: string
  secure?: boolean
}

const STORAGE_KEY = 'smtp_profiles_v1'
const ACTIVE_KEY = 'smtp_active_profile_id_v1'

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function SmtpPage() {
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles())
  const [activeId, setActiveId] = useState<string | null>(localStorage.getItem(ACTIVE_KEY))
  const [message, setMessage] = useState<string | null>(null)

  const [form, setForm] = useState<Profile>({ id: '', name: '', host: '', port: 587, user: '', pass: '', secure: false })

  useEffect(() => { saveProfiles(profiles) }, [profiles])
  useEffect(() => { if (activeId) localStorage.setItem(ACTIVE_KEY, activeId) }, [activeId])

  function selectForEdit(p?: Profile) {
    if (!p) {
      setForm({ id: '', name: '', host: '', port: 587, user: '', pass: '', secure: false })
    } else {
      setForm({ ...p })
    }
  }

  function addOrUpdate() {
    if (!form.name || !form.host || !form.port || !form.user || !form.pass) {
      setMessage('Please fill all required fields')
      return
    }
    if (form.id) {
      setProfiles(prev => prev.map(p => p.id === form.id ? { ...form } : p))
    } else {
      setProfiles(prev => [{ ...form, id: uid() }, ...prev])
    }
    setMessage('Saved locally')
  }

  function remove(id: string) {
    setProfiles(prev => prev.filter(p => p.id !== id))
    if (activeId === id) setActiveId(null)
  }

  async function saveActiveToBackend() {
    const active = profiles.find(p => p.id === activeId)
    if (!active) { setMessage('Choose an active profile'); return }
    try {
      const res = await api.saveSmtpConfig({ host: active.host, port: Number(active.port), user: active.user, pass: active.pass, secure: Boolean(active.secure) })
      setMessage(res.message)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getSmtpConfig()
        if (res.success && res.config) {
          setMessage('Backend has an SMTP config set')
        }
      } catch {}
    })()
  }, [])

  return (
    <div className="grid">
      <div className="card">
        <h2>SMTP Profiles (local)</h2>
        <div className="grid cols-2">
          <div className="grid">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <label>Host</label>
            <input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} />
            <label>Port</label>
            <input type="number" value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })} />
          </div>
          <div className="grid">
            <label>User</label>
            <input value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} />
            <label>Password</label>
            <input type="password" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} />
            <label className="row"><input type="checkbox" checked={!!form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} /> Use SSL</label>
          </div>
        </div>
        <div className="row">
          <button onClick={addOrUpdate}>{form.id ? 'Update profile' : 'Add profile'}</button>
          <button className="secondary" onClick={() => selectForEdit(undefined)}>Clear</button>
        </div>
        {message && <p className="muted">{message}</p>}
      </div>

      <div className="card">
        <h2>Profiles</h2>
        {profiles.length === 0 ? (
          <p className="muted">No profiles yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Active</th>
                <th>Name</th>
                <th>Host</th>
                <th>User</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id}>
                  <td><input type="radio" name="active" checked={activeId === p.id} onChange={() => setActiveId(p.id)} /></td>
                  <td>{p.name}</td>
                  <td>{p.host}:{p.port}{p.secure ? ' (SSL)' : ''}</td>
                  <td>{p.user}</td>
                  <td className="row">
                    <button className="secondary" onClick={() => selectForEdit(p)}>Edit</button>
                    <button className="secondary" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="row">
          <button onClick={saveActiveToBackend} disabled={!activeId}>Set Active on Backend</button>
        </div>
      </div>
    </div>
  )
}


