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
  
  // States für Medien-Handling (PDF & Bilder)
  const [fileType, setFileType] = useState('text') // 'text', 'pdf' oder 'image'
  const [mediaUrl, setMediaUrl] = useState('')

  useEffect(() => {
    fetchContextFiles()
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl)
    }
  }, [mediaUrl])

  const fetchContextFiles = async () => {
    try {
      const response = await fetch('/api/context-files')
      const data = await response.json()
      setFiles(data.files || [])
      
      if (data.files?.length > 0 && !selectedFile) {
        selectFile(data.files[0])
      }
    } catch (error) {
      console.error('Error fetching context files:', error)
    }
  }

  const selectFile = async (file) => {
    setSelectedFile(file)
    setIsEditing(false)
    setShowPreview(false)
    
    const fileName = file.name.toLowerCase()
    const isImg = /\.(jpg|jpeg|png|gif|webp)$/.test(fileName)
    const isPdf = fileName.endsWith('.pdf')

    // Setze den Typ fest
    if (isPdf) setFileType('pdf')
    else if (isImg) setFileType('image')
    else setFileType('text')

    try {
      const response = await fetch(`/api/context-files/${file.name}`)
      
      if (isPdf || isImg) {
        // Binärdaten (Blob) für Bilder und PDFs laden
        const blob = await response.blob()
        if (mediaUrl) URL.revokeObjectURL(mediaUrl)
        const url = URL.createObjectURL(blob)
        setMediaUrl(url)
        setFileContent('')
      } else {
        // Normale Textdatei
        const content = await response.text()
        setFileContent(content)
        setEditedContent(content)
        setMediaUrl('')
      }
    } catch (error) {
      console.error('Error loading file:', error)
      setFileContent('Fehler beim Laden der Datei')
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/context-files/${selectedFile.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: editedContent
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
                {fileType === 'text' && !isEditing && (
                  <>
                    <button onClick={() => setShowPreview(!showPreview)}>
                      {showPreview ? '📝 Editor' : '👁️ Vorschau'}
                    </button>
                    <button onClick={() => setIsEditing(true)}>
                      ✏️ Bearbeiten
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
                {fileType !== 'text' && (
                  <span className="info-badge">
                    {fileType === 'pdf' ? '📄 PDF' : '🖼️ Bild'} (Nur Lesezugriff)
                  </span>
                )}
              </div>
            </div>
            
            <div className="editor-content" style={{ height: 'calc(100% - 80px)', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              {fileType === 'pdf' ? (
                <iframe
                  src={mediaUrl}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                  title="PDF Vorschau"
                />
              ) : fileType === 'image' ? (
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <img
                    src={mediaUrl}
                    alt={selectedFile.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </div>
              ) : showPreview && !isEditing ? (
                <div className="markdown-preview" style={{ width: '100%' }}>
                  <ReactMarkdown>{fileContent}</ReactMarkdown>
                </div>
              ) : isEditing ? (
                <textarea
                  className="content-editor"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{ width: '100%' }}
                />
              ) : (
                <pre className="content-viewer" style={{ width: '100%' }}>{fileContent}</pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ContextFiles
