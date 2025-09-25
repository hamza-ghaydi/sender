import { useEffect, useState } from 'react'
import { api } from '../api'
import '../ui/layout.css'

export default function SettingsPage() {
  const [delayMs, setDelayMs] = useState<number>(1000)
  const [maxPerDay, setMaxPerDay] = useState<number>(100)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getSettings()
        setDelayMs(Number(res.settings.delay_ms))
        setMaxPerDay(Number(res.settings.max_emails_per_day))
      } catch (e: any) {
        setMessage(e.message)
      }
    })()
  }, [])

  async function save() {
    try {
      const res = await api.saveSettings({ delay_ms: Number(delayMs), max_emails_per_day: Number(maxPerDay) })
      setMessage(res.message)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  return (
    <div className="card grid">
      <h2>Sending Settings</h2>
      <label>Delay between emails (ms)</label>
      <input type="number" value={delayMs} onChange={e => setDelayMs(Number(e.target.value))} />
      <label>Max emails per day</label>
      <input type="number" value={maxPerDay} onChange={e => setMaxPerDay(Number(e.target.value))} />
      <div className="row">
        <button onClick={save}>Save Settings</button>
      </div>
      {message && <p className="muted">{message}</p>}
    </div>
  )
}


