import React, { useState, useEffect } from 'react'
import './Dashboard.css'

function Dashboard({ projects }) {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/activity?limit=5')
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const calculateStats = () => {
    let totalTasks = 0
    let completedTasks = 0
    let inProgressTasks = 0
    
    projects.forEach(project => {
      const tasks = project.tasks || []
      totalTasks += tasks.length
      completedTasks += tasks.filter(t => t.status === 'done').length
      inProgressTasks += tasks.filter(t => t.status === 'in-progress').length
    })

    return { totalTasks, completedTasks, inProgressTasks }
  }

  const stats = calculateStats()

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Überblick über das Kanban und Aktivitäten</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Kanban</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalTasks}</div>
          <div className="stat-label">Aufgaben gesamt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inProgressTasks}</div>
          <div className="stat-label">In Arbeit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedTasks}</div>
          <div className="stat-label">Erledigt</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-projects">
          <h2>📋 Kanban</h2>
          <div className="project-grid">
            {projects.map(project => (
              <div 
                key={project.id} 
                className="project-card"
                style={{ borderTopColor: project.color }}
              >
                <h3>{project.name}</h3>
                <p>{project.description || 'Keine Beschreibung'}</p>
                <div className="project-stats">
                  <span>📋 {project.tasks?.length || 0} Aufgaben</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-activity">
          <h2>📜 Letzte Aktivitäten</h2>
          <div className="activity-list">
            {activities.length === 0 ? (
              <p className="no-activities">Keine Aktivitäten</p>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id || index} className="activity-item">
                  <div className="activity-time">
                    {new Date(activity.timestamp).toLocaleString('de-DE')}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                  </div>
                  <div className={`activity-status ${activity.status}`}>
                    {activity.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard