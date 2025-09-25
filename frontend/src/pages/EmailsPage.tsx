import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import '../ui/layout.css'

type EmailRow = {
  id: number
  email: string
  status: string
  created_at?: string
  sent_at?: string | null
  error_message?: string | null
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailRow[]>([])
  const [loading, setLoading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const pendingCount = useMemo(() => emails.filter(e => e.status === 'pending').length, [emails])
  const sentCount = useMemo(() => emails.filter(e => e.status === 'sent').length, [emails])
  const failedCount = useMemo(() => emails.filter(e => e.status === 'failed').length, [emails])

  async function loadEmails() {
    setLoading(true)
    try {
      const res = await api.getEmails()
      setEmails(res.emails)
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmails()
  }, [])

  async function handleUploadCsv() {
    if (!csvFile) return
    setMessage(null)
    const form = new FormData()
    form.append('csvFile', csvFile)
    try {
      const res = await api.uploadEmailsCsv(form)
      setMessage(res.message)
      await loadEmails()
      setCsvFile(null)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function handleUploadList() {
    const lines = pasteText.split(/[\n,;\r]+/).map(s => s.trim()).filter(Boolean)
    if (lines.length === 0) return
    setMessage(null)
    try {
      const res = await api.uploadEmailsList(lines)
      setMessage(res.message)
      await loadEmails()
      setPasteText('')
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function handleInlineSave(id: number, email: string) {
    try {
      await api.updateEmail(id, email)
      await loadEmails()
      setMessage('Email updated')
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteEmail(id)
      setEmails(prev => prev.filter(e => e.id !== id))
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function handleClearAll() {
    if (!confirm('Clear all emails?')) return
    try {
      await api.clearEmails()
      setEmails([])
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Upload Emails</h2>
        <div className="grid cols-2">
          <div className="grid">
            <label>CSV file (column named "email" or first column)</label>
            <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
            <div className="row">
              <button onClick={handleUploadCsv} disabled={!csvFile}>Upload CSV</button>
              {csvFile && <span className="muted">{csvFile.name}</span>}
            </div>
          </div>
          <div className="grid">
            <label>Paste emails (comma or newline separated)</label>
            <textarea rows={6} value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <button onClick={handleUploadList} disabled={!pasteText.trim()}>Upload List</button>
          </div>
        </div>
        {message && <p className="muted">{message}</p>}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Emails ({emails.length})</h2>
          <div className="row">
            <div className="muted" style={{ marginRight: 12 }}>pending {pendingCount} · sent {sentCount} · failed {failedCount}</div>
            <button className="secondary" onClick={handleClearAll} disabled={!emails.length}>Clear All</button>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ maxHeight: 420, overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Sent At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {emails.map(row => (
                  <EmailRowItem key={row.id} row={row} onSave={handleInlineSave} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EmailRowItem({ row, onSave, onDelete }: { row: EmailRow, onSave: (id: number, email: string) => void, onDelete: (id: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(row.email)
  return (
    <tr>
      <td>
        {editing ? (
          <span className="row">
            <input value={value} onChange={e => setValue(e.target.value)} />
            <button onClick={() => { setEditing(false); onSave(row.id, value) }}>Save</button>
            <button className="secondary" onClick={() => { setEditing(false); setValue(row.email) }}>Cancel</button>
          </span>
        ) : (
          <span className="row">
            <span>{row.email}</span>
            <button className="secondary" onClick={() => setEditing(true)}>Edit</button>
            <button className="secondary" onClick={() => onDelete(row.id)}>Delete</button>
          </span>
        )}
      </td>
      <td>{row.status}</td>
      <td className="muted">{row.created_at?.replace('T',' ').replace('Z','')}</td>
      <td className="muted">{row.sent_at?.replace('T',' ').replace('Z','')}</td>
      <td className="muted">{row.error_message}</td>
    </tr>
  )
}


