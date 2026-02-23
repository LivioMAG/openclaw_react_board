import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Sidebar.css'

function Sidebar({ projects, activeProjectId, setActiveProjectId, fetchProjects }) {
  const [agentStatus, setAgentStatus] = useState({ status: 'available', text: 'Verfügbar' })
  const [projectsExpanded, setProjectsExpanded] = useState(false)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectPath, setNewProjectPath] = useState('/workspace/')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAgentStatus()
    const interval = setInterval(fetchAgentStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent-status')
      const data = await response.json()
      setAgentStatus(data)
    } catch (error) {
      console.error('Error fetching agent status:', error)
    }
  }

  const handleProjectClick = (projectId) => {
    setActiveProjectId(projectId)
    localStorage.setItem('lastProjectId', projectId)
    navigate(`/projects/${projectId}`)
  }



  const resetCreateProjectForm = () => {
    setNewProjectName('')
    setNewProjectDescription('')
    setNewProjectPath('/workspace/')
    setCreateProjectError('')
  }

  const handleOpenCreateProjectModal = () => {
    resetCreateProjectForm()
    setShowCreateProjectModal(true)
  }

  const handleCloseCreateProjectModal = () => {
    setShowCreateProjectModal(false)
    setIsCreatingProject(false)
    setCreateProjectError('')
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()

    if (!newProjectName.trim()) {
      setCreateProjectError('Bitte einen Projektnamen eingeben.')
      return
    }

    setIsCreatingProject(true)
    setCreateProjectError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim(),
          projectPath: newProjectPath.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setCreateProjectError(data.error || 'Projekt konnte nicht erstellt werden.')
        return
      }

      await fetchProjects()
      setProjectsExpanded(true)
      handleProjectClick(data.id)
      handleCloseCreateProjectModal()
    } catch (error) {
      console.error('Error creating project:', error)
      setCreateProjectError('Projekt konnte nicht erstellt werden.')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const isActiveTab = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">🦞 Molt's Kanban</div>
      
      <div className="agent-status">
        <div className={`agent-status-dot ${agentStatus.status}`}></div>
        <span className="agent-status-text">{agentStatus.text}</span>
      </div>
      
      <nav className="nav-menu">
        <Link to="/" className={`nav-item ${isActiveTab('/') ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Dashboard</span>
        </Link>
        
        <div 
          className={`nav-item ${isActiveTab('/projects') ? 'active' : ''}`}
          onClick={() => setProjectsExpanded(!projectsExpanded)}
        >
          <span className="nav-icon">📁</span>
          <span className="nav-label">Projekte</span>
        </div>
        
        {projectsExpanded && (
          <div className="nav-submenu">
            <div className="projects-list">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
                  onClick={() => handleProjectClick(project.id)}
                  style={{ borderLeftColor: project.color }}
                >
                  <div className="project-id">{project.id}</div>
                  <div className="project-name">{project.name}</div>
                </div>
              ))}
            </div>
            <button className="add-project-btn" onClick={handleOpenCreateProjectModal}>
              + Neues Projekt
            </button>
          </div>
        )}
        
        <Link to="/activities" className={`nav-item ${isActiveTab('/activities') ? 'active' : ''}`}>
          <span className="nav-icon">📜</span>
          <span className="nav-label">Aktivitäten</span>
        </Link>
        
        <Link to="/context" className={`nav-item ${isActiveTab('/context') ? 'active' : ''}`}>
          <span className="nav-icon">🧠</span>
          <span className="nav-label">Context-Speicher</span>
        </Link>
      </nav>


      {showCreateProjectModal && (
        <div className="create-project-modal-overlay" onClick={handleCloseCreateProjectModal}>
          <div className="create-project-modal" onClick={event => event.stopPropagation()}>
            <h3>Neues Projekt</h3>
            <form onSubmit={handleCreateProject}>
              <label>
                Name
                <input
                  type="text"
                  value={newProjectName}
                  onChange={event => setNewProjectName(event.target.value)}
                  placeholder="Projektname"
                />
              </label>

              <label>
                Beschreibung
                <textarea
                  value={newProjectDescription}
                  onChange={event => setNewProjectDescription(event.target.value)}
                  placeholder="Kurze Beschreibung"
                  rows={3}
                />
              </label>

              <label>
                Projektpfad
                <input
                  type="text"
                  value={newProjectPath}
                  onChange={event => setNewProjectPath(event.target.value)}
                  placeholder="/workspace/"
                />
              </label>

              {createProjectError && (
                <p className="create-project-error">⚠️ {createProjectError}</p>
              )}

              <div className="create-project-actions">
                <button type="button" onClick={handleCloseCreateProjectModal} disabled={isCreatingProject}>
                  Abbrechen
                </button>
                <button type="submit" disabled={isCreatingProject}>
                  {isCreatingProject ? 'Erstelle…' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </aside>
  )
}

export default Sidebar