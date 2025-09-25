import { useState, useEffect } from 'react'
import { api } from '../api'

interface EmailList {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface EmailListItem {
  id: number
  list_id: number
  email: string
  created_at: string
}

export default function EmailListsPage() {
  const [lists, setLists] = useState<EmailList[]>([])
  const [selectedList, setSelectedList] = useState<EmailList | null>(null)
  const [listEmails, setListEmails] = useState<EmailListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAddEmailForm, setShowAddEmailForm] = useState(false)
  const [editingList, setEditingList] = useState<EmailList | null>(null)
  const [editingEmail, setEditingEmail] = useState<EmailListItem | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailText, setEmailText] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)

  useEffect(() => {
    loadLists()
  }, [])

  useEffect(() => {
    if (selectedList) {
      loadListEmails(selectedList.id)
    }
  }, [selectedList])

  const loadLists = async () => {
    try {
      setLoading(true)
      const response = await api.getEmailLists()
      setLists(response.lists)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email lists')
    } finally {
      setLoading(false)
    }
  }

  const loadListEmails = async (listId: number) => {
    try {
      setLoading(true)
      const response = await api.getEmailListItems(listId)
      setListEmails(response.emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list emails')
    } finally {
      setLoading(false)
    }
  }

  const createList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    try {
      setLoading(true)
      await api.createEmailList(newListName.trim())
      setNewListName('')
      setShowCreateForm(false)
      setSuccess('Email list created successfully')
      loadLists()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create email list')
    } finally {
      setLoading(false)
    }
  }

  const updateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingList || !newListName.trim()) return

    try {
      setLoading(true)
      await api.updateEmailList(editingList.id, newListName.trim())
      setEditingList(null)
      setNewListName('')
      setSuccess('Email list updated successfully')
      loadLists()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email list')
    } finally {
      setLoading(false)
    }
  }

  const deleteList = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email list? This will also delete all emails in the list.')) return

    try {
      setLoading(true)
      await api.deleteEmailList(id)
      setSuccess('Email list deleted successfully')
      if (selectedList?.id === id) {
        setSelectedList(null)
        setListEmails([])
      }
      loadLists()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete email list')
    } finally {
      setLoading(false)
    }
  }

  const addEmails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedList) return

    try {
      setLoading(true)
      let response

      if (csvFile) {
        const formData = new FormData()
        formData.append('csvFile', csvFile)
        response = await api.uploadEmailsToList(selectedList.id, formData)
        setCsvFile(null)
      } else if (emailText.trim()) {
        const emails = emailText.split(/[,\n\r]+/).map(email => email.trim()).filter(email => email)
        response = await api.addEmailsToList(selectedList.id, emails)
        setEmailText('')
      } else {
        setError('Please provide emails or upload a CSV file')
        return
      }

      setShowAddEmailForm(false)
      setSuccess(`Added emails successfully. Added: ${response.results.added.length}, Duplicates: ${response.results.duplicates.length}`)
      loadListEmails(selectedList.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add emails')
    } finally {
      setLoading(false)
    }
  }

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmail || !newEmail.trim()) return

    try {
      setLoading(true)
      await api.updateEmailInList(editingEmail.list_id, editingEmail.id, newEmail.trim())
      setEditingEmail(null)
      setNewEmail('')
      setSuccess('Email updated successfully')
      loadListEmails(editingEmail.list_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setLoading(false)
    }
  }

  const deleteEmail = async (emailId: number, listId: number) => {
    if (!confirm('Are you sure you want to delete this email?')) return

    try {
      setLoading(true)
      await api.deleteEmailFromList(listId, emailId)
      setSuccess('Email deleted successfully')
      loadListEmails(listId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete email')
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Email Lists</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New List
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

      <div className="email-lists-container">
        <div className="lists-sidebar">
          <h3>Email Lists</h3>
          {loading && <div className="loading">Loading...</div>}
          <div className="lists">
            {lists.map(list => (
              <div 
                key={list.id} 
                className={`list-item ${selectedList?.id === list.id ? 'active' : ''}`}
                onClick={() => setSelectedList(list)}
              >
                <div className="list-name">{list.name}</div>
                <div className="list-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingList(list)
                      setNewListName(list.name)
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteList(list.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="list-content">
          {selectedList ? (
            <>
              <div className="list-header">
                <h2>{selectedList.name}</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddEmailForm(true)}
                >
                  Add Emails
                </button>
              </div>

              <div className="emails-list">
                {listEmails.length === 0 ? (
                  <div className="empty-state">
                    <p>No emails in this list yet.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowAddEmailForm(true)}
                    >
                      Add Emails
                    </button>
                  </div>
                ) : (
                  <div className="emails-table">
                    <div className="table-header">
                      <div>Email</div>
                      <div>Added</div>
                      <div>Actions</div>
                    </div>
                    {listEmails.map(email => (
                      <div key={email.id} className="table-row">
                        <div className="email-cell">
                          {editingEmail?.id === email.id ? (
                            <form onSubmit={updateEmail} className="inline-form">
                              <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                autoFocus
                              />
                              <button type="submit" className="btn btn-sm btn-primary">Save</button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setEditingEmail(null)
                                  setNewEmail('')
                                }}
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <span>{email.email}</span>
                          )}
                        </div>
                        <div className="date-cell">
                          {new Date(email.created_at).toLocaleDateString()}
                        </div>
                        <div className="actions-cell">
                          {editingEmail?.id !== email.id && (
                            <>
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setEditingEmail(email)
                                  setNewEmail(email.email)
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteEmail(email.id, email.list_id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select an email list to view its contents.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Email List</h3>
              <button 
                className="close"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewListName('')
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={createList}>
              <div className="form-group">
                <label htmlFor="listName">List Name</label>
                <input
                  id="listName"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Clients France, Test List"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create List'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewListName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {editingList && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Email List</h3>
              <button 
                className="close"
                onClick={() => {
                  setEditingList(null)
                  setNewListName('')
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={updateList}>
              <div className="form-group">
                <label htmlFor="editListName">List Name</label>
                <input
                  id="editListName"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update List'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingList(null)
                    setNewListName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Emails Modal */}
      {showAddEmailForm && selectedList && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Emails to {selectedList.name}</h3>
              <button 
                className="close"
                onClick={() => {
                  setShowAddEmailForm(false)
                  setEmailText('')
                  setCsvFile(null)
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={addEmails}>
              <div className="form-group">
                <label htmlFor="emailText">Emails (comma or line separated)</label>
                <textarea
                  id="emailText"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label htmlFor="csvFile">Or upload CSV file</label>
                <input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Emails'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddEmailForm(false)
                    setEmailText('')
                    setCsvFile(null)
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
