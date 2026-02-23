import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Sidebar.css'

function Sidebar({ projects, activeProjectId, setActiveProjectId }) {
  const [agentStatus, setAgentStatus] = useState({ status: 'available', text: 'Verfügbar' })
  const location = useLocation()
  const navigate = useNavigate()
  const mainKanban = projects[0]

  useEffect(() => {
    fetchAgentStatus()
    const interval = setInterval(fetchAgentStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (mainKanban && !activeProjectId) {
      setActiveProjectId(mainKanban.id)
    }
  }, [mainKanban, activeProjectId, setActiveProjectId])

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent-status')
      const data = await response.json()
      setAgentStatus(data)
    } catch (error) {
      console.error('Error fetching agent status:', error)
    }
  }

  const handleKanbanClick = () => {
    if (!mainKanban) {
      return
    }

    setActiveProjectId(mainKanban.id)
    localStorage.setItem('lastProjectId', mainKanban.id)
    navigate(`/projects/${mainKanban.id}`)
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
          onClick={handleKanbanClick}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Kanban</span>
        </div>

        {mainKanban && (
          <div className="nav-submenu">
            <div className="projects-list">
              <div
                className={`project-item ${activeProjectId === mainKanban.id ? 'active' : ''}`}
                onClick={handleKanbanClick}
                style={{ borderLeftColor: mainKanban.color }}
              >
                <div className="project-id">{mainKanban.id}</div>
                <div className="project-name">{mainKanban.name}</div>
              </div>
            </div>
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
    </aside>
  )
}

export default Sidebar
