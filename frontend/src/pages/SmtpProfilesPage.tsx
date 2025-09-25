import { useState, useEffect } from 'react'
import { api } from '../api'

interface SmtpProfile {
  id: number
  name: string
  host: string
  port: number
  username: string
  password?: string
  encryption: string
  created_at: string
  updated_at: string
}

export default function SmtpProfilesPage() {
  const [profiles, setProfiles] = useState<SmtpProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<SmtpProfile | null>(null)
  const [testingProfile, setTestingProfile] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    encryption: 'none'
  })

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const response = await api.getSmtpProfiles()
      setProfiles(response.profiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SMTP profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '',
      username: '',
      password: '',
      encryption: 'none'
    })
  }

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const profile = {
        ...formData,
        port: parseInt(formData.port)
      }
      await api.createSmtpProfile(profile)
      resetForm()
      setShowCreateForm(false)
      setSuccess('SMTP profile created successfully')
      loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SMTP profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfile) return

    try {
      setLoading(true)
      const profile = {
        ...formData,
        port: parseInt(formData.port)
      }
      await api.updateSmtpProfile(editingProfile.id, profile)
      setEditingProfile(null)
      resetForm()
      setSuccess('SMTP profile updated successfully')
      loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SMTP profile')
    } finally {
      setLoading(false)
    }
  }

  const deleteProfile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this SMTP profile?')) return

    try {
      setLoading(true)
      await api.deleteSmtpProfile(id)
      setSuccess('SMTP profile deleted successfully')
      loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete SMTP profile')
    } finally {
      setLoading(false)
    }
  }

  const testProfile = async (id: number) => {
    try {
      setTestingProfile(id)
      await api.testSmtpProfile(id)
      setSuccess('SMTP connection test successful!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SMTP connection test failed')
    } finally {
      setTestingProfile(null)
    }
  }

  const startEdit = (profile: SmtpProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      host: profile.host,
      port: profile.port.toString(),
      username: profile.username,
      password: '', // Don't pre-fill password for security
      encryption: profile.encryption
    })
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>SMTP Profiles</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Profile
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearMessages} className="close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={clearMessages} className="close">×</button>
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      <div className="profiles-grid">
        {profiles.map(profile => (
          <div key={profile.id} className="profile-card">
            <div className="profile-header">
              <h3>{profile.name}</h3>
              <div className="profile-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => startEdit(profile)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-sm btn-info"
                  onClick={() => testProfile(profile.id)}
                  disabled={testingProfile === profile.id}
                >
                  {testingProfile === profile.id ? 'Testing...' : 'Test'}
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteProfile(profile.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="profile-details">
              <div className="detail-row">
                <span className="label">Host:</span>
                <span className="value">{profile.host}</span>
              </div>
              <div className="detail-row">
                <span className="label">Port:</span>
                <span className="value">{profile.port}</span>
              </div>
              <div className="detail-row">
                <span className="label">Username:</span>
                <span className="value">{profile.username}</span>
              </div>
              <div className="detail-row">
                <span className="label">Encryption:</span>
                <span className="value">{profile.encryption.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Created:</span>
                <span className="value">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !loading && (
        <div className="empty-state">
          <p>No SMTP profiles created yet.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Profile
          </button>
        </div>
      )}

      {/* Create/Edit Profile Modal */}
      {(showCreateForm || editingProfile) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProfile ? 'Edit SMTP Profile' : 'Create New SMTP Profile'}</h3>
              <button 
                className="close"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingProfile(null)
                  resetForm()
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={editingProfile ? updateProfile : createProfile}>
              <div className="form-group">
                <label htmlFor="name">Profile Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Gmail, Outlook, Custom SMTP"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="host">SMTP Host</label>
                <input
                  id="host"
                  name="host"
                  type="text"
                  value={formData.host}
                  onChange={handleInputChange}
                  placeholder="e.g., smtp.gmail.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="port">Port</label>
                <input
                  id="port"
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleInputChange}
                  placeholder="587"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="your-email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Your email password or app password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="encryption">Encryption</label>
                <select
                  id="encryption"
                  name="encryption"
                  value={formData.encryption}
                  onChange={handleInputChange}
                  required
                >
                  <option value="none">None</option>
                  <option value="ssl">SSL</option>
                  <option value="tls">TLS</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (editingProfile ? 'Updating...' : 'Creating...') : (editingProfile ? 'Update Profile' : 'Create Profile')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingProfile(null)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
