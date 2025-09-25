import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import '../ui/layout.css'

type Progress = { total: number; sent: number; failed: number; current: string | null }

export default function SendPage() {
  const [subject, setSubject] = useState('Test Email')
  const [html, setHtml] = useState('<h1>Hello!</h1><p>This is a test email.</p>')
  const [status, setStatus] = useState<string>('Idle')
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const pollRef = useRef<number | null>(null)
  const [delayMs, setDelayMs] = useState<number>(1000)
  const [countdownMs, setCountdownMs] = useState<number>(0)
  const countdownRef = useRef<number | null>(null)
  const lastSentRef = useRef<number>(0)

  async function poll() {
    try {
      const res = await api.sendStatus()
      setIsSending(res.isCurrentlySending)
      setProgress(res.progress)
      if (res.isCurrentlySending) {
        const currentSent = res.progress?.sent || 0
        if (currentSent !== lastSentRef.current) {
          lastSentRef.current = currentSent
          setCountdownMs(delayMs)
        }
        if (countdownRef.current == null) {
          countdownRef.current = window.setInterval(() => {
            setCountdownMs((ms) => (ms > 0 ? Math.max(0, ms - 250) : 0))
          }, 250)
        }
      } else {
        lastSentRef.current = 0
        setCountdownMs(0)
        if (countdownRef.current) {
          window.clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }
      if (!res.isCurrentlySending && pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
        setStatus('Idle')
      }
    } catch {}
  }

  useEffect(() => {
    ;(async () => {
      try {
        const s = await api.getSettings()
        setDelayMs(Number(s.settings.delay_ms) || 1000)
      } catch {}
      poll()
    })()
  }, [])

  async function start() {
    try {
      setStatus('Starting...')
      const res = await api.sendNow({ subject, htmlContent: html })
      setStatus(res.message)
      poll()
      if (!pollRef.current) pollRef.current = window.setInterval(poll, 1500)
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  async function stop() {
    try {
      const res = await api.stopSending()
      setStatus(res.message)
      poll()
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  async function reset() {
    try {
      const res = await api.resetStatuses()
      setStatus(res.message)
      poll()
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  return (
    <div className="grid">
      <div className="card grid">
        <h2>Compose</h2>
        <label>Subject</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} />
        <label>HTML Content</label>
        <textarea rows={10} value={html} onChange={e => setHtml(e.target.value)} />
        <div className="row">
          <button onClick={start} disabled={isSending}>Start Sending</button>
          <button className="secondary" onClick={stop} disabled={!isSending}>Stop</button>
          <button className="secondary" onClick={reset}>Reset Statuses</button>
        </div>
        <p className="muted">{status}</p>
      </div>

      <div className="card">
        <h2>Status</h2>
        {progress ? (
          <div className="grid">
            <div>Total: {progress.total}</div>
            <div>Sent: {progress.sent}</div>
            <div>Failed: {progress.failed}</div>
            <div>Current: {progress.current || '-'}</div>
            {isSending && (
              <div>Next send in: {Math.ceil(countdownMs / 100) / 10}s</div>
            )}
          </div>
        ) : (
          <p className="muted">No sending in progress</p>
        )}
      </div>
    </div>
  )
}


