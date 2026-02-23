import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './ContextFiles.css'

function ContextFiles() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchContextFiles()
  }, [])

  const fetchContextFiles = async () => {
    try {
      const response = await fetch('/api/context-files')
      const data = await response.json()
      const nextFiles = data.files || []
      setFiles(nextFiles)

      if (selectedFile) {
        const updatedSelectedFile = nextFiles.find(file => file.name === selectedFile.name)
        if (updatedSelectedFile) {
          setSelectedFile(updatedSelectedFile)
        }
      }

      if (nextFiles.length > 0 && !selectedFile) {
        selectFile(nextFiles[0])
      }
    } catch (error) {
      console.error('Error fetching context files:', error)
    }
  }

  const selectFile = async (file) => {
    setSelectedFile(file)
    setIsEditing(false)

    try {
      const response = await fetch(`/api/context-files/${file.name}`)
      const contentType = response.headers.get('content-type') || ''

      if (!response.ok) {
        throw new Error('Datei konnte nicht geladen werden')
      }

      if (contentType.includes('application/json')) {
        const data = await response.json()
        const content = data.content || ''
        setFileContent(content)
        setEditedContent(content)
      } else {
        const content = await response.text()
        setFileContent(content)
        setEditedContent(content)
      }
    } catch (error) {
      console.error('Error loading file:', error)
      setFileContent('Fehler beim Laden der Datei')
      setEditedContent('')
    }
  }

  const handleSave = async () => {
    if (!selectedFile) {
      return
    }

    try {
      const payload = { content: editedContent }
      const response = await fetch(`/api/context-files/${selectedFile.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setFileContent(editedContent)
        setIsEditing(false)
        fetchContextFiles()
      }
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedFile) {
      return
    }

    const confirmed = window.confirm(`Datei wirklich löschen?\n${selectedFile.name}`)
    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/context-files/${selectedFile.name}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Datei konnte nicht gelöscht werden')
      }

      setSelectedFile(null)
      setFileContent('')
      setEditedContent('')
      setIsEditing(false)
      await fetchContextFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      alert(error.message || 'Datei konnte nicht gelöscht werden')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'n/a'
    const kb = bytes / 1024
    return kb < 1 ? `${bytes} B` : `${kb.toFixed(1)} KB`
  }

  return (
    <div className="context-files-page">
      <div className="context-sidebar">
        <div className="context-header">
          <h2>🧠 Context-Speicher</h2>
          <p>Agent-Konfiguration & Memory</p>
        </div>

        <div className="files-list">
          {files.map(file => (
            <div
              key={file.name}
              className={`file-item ${selectedFile?.name === file.name ? 'active' : ''} ${!file.exists ? 'missing' : ''}`}
              onClick={() => file.exists && selectFile(file)}
            >
              <div className="file-size">{file.exists ? formatFileSize(file.size) : 'nicht vorhanden'}</div>
              <div className="file-name">{file.name}</div>
              <div className="file-desc">{file.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="context-editor">
        {selectedFile && (
          <>
            <div className="editor-header">
              <div className="editor-title">
                <h3>{selectedFile.name}</h3>
                <p>{selectedFile.description}</p>
              </div>
              <div className="editor-actions">
                {!isEditing && (
                  <>
                    <button onClick={() => setShowPreview(!showPreview)}>
                      {showPreview ? '📝 Editor' : '👁️ Vorschau'}
                    </button>
                    <button onClick={() => setIsEditing(true)}>
                      ✏️ Bearbeiten
                    </button>
                    <button onClick={handleDelete} className="danger-btn" disabled={isDeleting}>
                      {isDeleting ? '⏳ Lösche…' : '🗑️ Löschen'}
                    </button>
                  </>
                )}
                {isEditing && (
                  <>
                    <button onClick={() => setIsEditing(false)}>
                      ❌ Abbrechen
                    </button>
                    <button onClick={handleSave} className="save-btn">
                      💾 Speichern
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="editor-content">
              {showPreview && !isEditing ? (
                <div className="markdown-preview">
                  <ReactMarkdown>{fileContent}</ReactMarkdown>
                </div>
              ) : isEditing ? (
                <textarea
                  className="content-editor"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Dateiinhalt bearbeiten..."
                />
              ) : (
                <pre className="content-viewer">{fileContent}</pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ContextFiles
