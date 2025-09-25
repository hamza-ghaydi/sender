import { useState, useEffect } from 'react'
import { api } from '../api'

interface Campaign {
  id: number
  name: string
  subject: string
  template: string
  list_id: number
  smtp_profile_id: number
  status: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  list_name: string
  smtp_profile_name: string
}

interface EmailList {
  id: number
  name: string
}

interface SmtpProfile {
  id: number
  name: string
}

interface CampaignStats {
  total: number
  sent: number
  failed: number
  pending: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [emailLists, setEmailLists] = useState<EmailList[]>([])
  const [smtpProfiles, setSmtpProfiles] = useState<SmtpProfile[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    template: '',
    list_id: '',
    smtp_profile_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignStats(selectedCampaign.id)
    }
  }, [selectedCampaign])

  const loadData = async () => {
    try {
      setLoading(true)
      const [campaignsRes, listsRes, profilesRes] = await Promise.all([
        api.getCampaigns(),
        api.getEmailLists(),
        api.getSmtpProfiles()
      ])
      setCampaigns(campaignsRes.campaigns)
      setEmailLists(listsRes.lists)
      setSmtpProfiles(profilesRes.profiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadCampaignStats = async (campaignId: number) => {
    try {
      const response = await api.getCampaignStats(campaignId)
      setCampaignStats(response.stats)
    } catch (err) {
      console.error('Failed to load campaign stats:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      template: '',
      list_id: '',
      smtp_profile_id: ''
    })
  }

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const campaign = {
        ...formData,
        list_id: parseInt(formData.list_id),
        smtp_profile_id: parseInt(formData.smtp_profile_id)
      }
      await api.createCampaign(campaign)
      resetForm()
      setShowCreateForm(false)
      setSuccess('Campaign created successfully')
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const updateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return

    try {
      setLoading(true)
      const campaign = {
        ...formData,
        list_id: parseInt(formData.list_id),
        smtp_profile_id: parseInt(formData.smtp_profile_id),
        status: editingCampaign.status
      }
      await api.updateCampaign(editingCampaign.id, campaign)
      setEditingCampaign(null)
      resetForm()
      setSuccess('Campaign updated successfully')
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign')
    } finally {
      setLoading(false)
    }
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      setLoading(true)
      await api.deleteCampaign(id)
      setSuccess('Campaign deleted successfully')
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null)
        setCampaignStats(null)
      }
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setLoading(false)
    }
  }

  const startCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to start this campaign? This will begin sending emails immediately.')) return

    try {
      setLoading(true)
      await api.startCampaign(id)
      setSuccess('Campaign started successfully!')
      loadData()
      if (selectedCampaign?.id === id) {
        loadCampaignStats(id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start campaign')
    } finally {
      setLoading(false)
    }
  }

  const debugCampaign = async (id: number) => {
    try {
      setLoading(true)
      const response = await api.getCampaignDebug(id)
      console.log('Campaign Debug Info:', response.debug)
      setSuccess(`Debug info logged to console. Check browser developer tools.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get debug info')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      template: campaign.template,
      list_id: campaign.list_id.toString(),
      smtp_profile_id: campaign.smtp_profile_id.toString()
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'status-draft'
      case 'in_progress': return 'status-progress'
      case 'completed': return 'status-completed'
      default: return 'status-draft'
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Campaigns</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Campaign
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

      <div className="campaigns-container">
        <div className="campaigns-sidebar">
          <h3>Campaigns</h3>
          {loading && <div className="loading">Loading...</div>}
          <div className="campaigns-list">
            {campaigns.map(campaign => (
              <div 
                key={campaign.id} 
                className={`campaign-item ${selectedCampaign?.id === campaign.id ? 'active' : ''}`}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="campaign-name">{campaign.name}</div>
                <div className={`campaign-status ${getStatusColor(campaign.status)}`}>
                  {campaign.status.replace('_', ' ')}
                </div>
                <div className="campaign-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEdit(campaign)
                    }}
                  >
                    Edit
                  </button>
                  {campaign.status === 'draft' && (
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={(e) => {
                        e.stopPropagation()
                        startCampaign(campaign.id)
                      }}
                    >
                      Start
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-info"
                    onClick={(e) => {
                      e.stopPropagation()
                      debugCampaign(campaign.id)
                    }}
                  >
                    Debug
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCampaign(campaign.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="campaign-content">
          {selectedCampaign ? (
            <>
              <div className="campaign-header">
                <h2>{selectedCampaign.name}</h2>
                <div className={`campaign-status-badge ${getStatusColor(selectedCampaign.status)}`}>
                  {selectedCampaign.status.replace('_', ' ')}
                </div>
              </div>

              <div className="campaign-details">
                <div className="detail-section">
                  <h3>Campaign Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Subject:</span>
                      <span className="value">{selectedCampaign.subject}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email List:</span>
                      <span className="value">{selectedCampaign.list_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">SMTP Profile:</span>
                      <span className="value">{selectedCampaign.smtp_profile_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Created:</span>
                      <span className="value">{new Date(selectedCampaign.created_at).toLocaleString()}</span>
                    </div>
                    {selectedCampaign.started_at && (
                      <div className="detail-item">
                        <span className="label">Started:</span>
                        <span className="value">{new Date(selectedCampaign.started_at).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedCampaign.completed_at && (
                      <div className="detail-item">
                        <span className="label">Completed:</span>
                        <span className="value">{new Date(selectedCampaign.completed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Email Template</h3>
                  <div className="template-preview">
                    <div dangerouslySetInnerHTML={{ __html: selectedCampaign.template }} />
                  </div>
                </div>

                {campaignStats && (
                  <div className="detail-section">
                    <h3>Campaign Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-number">{campaignStats.total}</span>
                        <span className="stat-label">Total Emails</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{campaignStats.sent}</span>
                        <span className="stat-label">Sent</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{campaignStats.failed}</span>
                        <span className="stat-label">Failed</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{campaignStats.pending}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a campaign to view its details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Campaign Modal */}
      {(showCreateForm || editingCampaign) && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h3>
              <button 
                className="close"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingCampaign(null)
                  resetForm()
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={editingCampaign ? updateCampaign : createCampaign}>
              <div className="form-group">
                <label htmlFor="name">Campaign Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Welcome Email Campaign"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Email Subject</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Welcome to our service!"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="list_id">Email List</label>
                <select
                  id="list_id"
                  name="list_id"
                  value={formData.list_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an email list</option>
                  {emailLists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="smtp_profile_id">SMTP Profile</label>
                <select
                  id="smtp_profile_id"
                  name="smtp_profile_id"
                  value={formData.smtp_profile_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an SMTP profile</option>
                  {smtpProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="template">Email Template (HTML)</label>
                <textarea
                  id="template"
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                  placeholder="<h1>Welcome!</h1><p>Thank you for joining us...</p>"
                  rows={10}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (editingCampaign ? 'Updating...' : 'Creating...') : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCampaign(null)
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
