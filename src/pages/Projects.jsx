import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import KanbanBoard from '../components/KanbanBoard'
import './Projects.css'

function Projects({ projects, activeProjectId, setActiveProjectId, fetchProjects }) {
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState('board')
  const [project, setProject] = useState(null)
  const [projectFiles, setProjectFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState('')

  useEffect(() => {
    if (projectId && projectId !== activeProjectId) {
      setActiveProjectId(projectId)
    }
  }, [projectId])

  useEffect(() => {
    const currentProject = projects.find(p => p.id === activeProjectId)
    setProject(currentProject)
  }, [activeProjectId, projects])

  useEffect(() => {
    if (!project || activeTab !== 'files') {
      return
    }

    const fetchProjectFiles = async () => {
      setFilesLoading(true)
      setFilesError('')

      try {
        const response = await fetch(`/api/projects/${project.id}/files`)
        const data = await response.json()

        if (!response.ok) {
          setProjectFiles([])
          setFilesError(data.error || 'Dateiliste konnte nicht geladen werden.')
          return
        }

        setProjectFiles(data.tree || [])
      } catch (error) {
        console.error('Error loading project files:', error)
        setProjectFiles([])
        setFilesError('Dateiliste konnte nicht geladen werden.')
      } finally {
        setFilesLoading(false)
      }
    }

    fetchProjectFiles()
  }, [activeTab, project])

  const flattenFiles = (nodes, depth = 0) => {
    return nodes.flatMap(node => {
      if (node.type === 'directory') {
        return [
          { ...node, depth, isDirectoryLabel: true },
          ...flattenFiles(node.children || [], depth + 1)
        ]
      }

      return [{ ...node, depth, isDirectoryLabel: false }]
    })
  }

  const getDownloadUrl = (filePath) => {
    const encodedPath = filePath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')

    return `/api/projects/${project.id}/files/${encodedPath}`
  }

  const handleTaskAdd = async (columnId, title) => {
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status: columnId,
          priority: 'medium'
        })
      })
      
      if (response.ok) {
        await fetchProjects()
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        await fetchProjects()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  if (!project) {
    return (
      <div className="projects-page">
        <div className="no-project-selected">
          <h2>Kein Aufgabenbereich ausgewählt</h2>
          <p>Wähle einen Aufgabenbereich aus der Seitenleiste aus</p>
        </div>
      </div>
    )
  }

  return (
    <div className="projects-page">
      <div className="project-header">
        <div className="project-header-info">
          <h1>{project.name}</h1>
          {project.description && <p>{project.description}</p>}
        </div>
      </div>

      <div className="project-tabs">
        <button 
          className={`tab ${activeTab === 'board' ? 'active' : ''}`}
          onClick={() => setActiveTab('board')}
        >
          📋 Board
        </button>
        <button 
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          📁 Files
        </button>
        <button 
          className={`tab ${activeTab === 'context' ? 'active' : ''}`}
          onClick={() => setActiveTab('context')}
        >
          📚 Context
        </button>
      </div>

      {activeTab === 'board' && (
        <KanbanBoard 
          project={project}
          onTaskAdd={handleTaskAdd}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {activeTab === 'files' && (
        <div className="files-browser">
          {filesLoading && <p>Dateiliste wird geladen…</p>}

          {!filesLoading && filesError && (
            <p className="files-error">⚠️ {filesError}</p>
          )}

          {!filesLoading && !filesError && (() => {
            const flatFiles = flattenFiles(projectFiles)

            return (
            <div className="files-listing">
              {flatFiles.length === 0 ? (
                <p>Keine Dateien gefunden.</p>
              ) : (
                flatFiles.map(item => (
                  <div
                    key={item.path}
                    className={`files-list-item ${item.isDirectoryLabel ? 'directory' : 'file'}`}
                    style={{ paddingLeft: `${1 + item.depth * 1.25}rem` }}
                  >
                    <span className="files-item-name">{item.icon} {item.name}</span>

                    {!item.isDirectoryLabel && (
                      <a
                        className="download-link"
                        href={getDownloadUrl(item.path)}
                        download={item.name}
                      >
                        ⬇️ Download
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
            )
          })()}
        </div>
      )}

      {activeTab === 'context' && (
        <div className="context-view">
          <p>Context View - Coming Soon</p>
        </div>
      )}
    </div>
  )
}

export default Projects
