import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: '-', pending: '-', users: '-' })

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login')
      return
    }
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/photo/list?page=1&pageSize=1')
      setStats((prev) => ({ ...prev, total: res.data.total ?? '-' }))
    } catch {
      // 静默处理
    }
    try {
      const res = await api.get('/admin/user/list?page=1&pageSize=1')
      setStats((prev) => ({ ...prev, users: res.data.total ?? '-' }))
    } catch {
      // 静默处理
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <h1 style={styles.logo}>乌东文旅 · 管理后台</h1>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.username || '管理员'}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>退出</button>
        </div>
      </header>
      <div style={styles.body}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>游记总数</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.pending}</div>
            <div style={styles.statLabel}>待审核</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.users}</div>
            <div style={styles.statLabel}>用户总数</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  layout: { minHeight: '100vh', background: '#f0f2f5' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    background: '#001529',
    color: '#fff',
  },
  logo: { fontSize: '16px', fontWeight: 600 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '14px' },
  logoutBtn: {
    padding: '4px 12px',
    fontSize: '13px',
    background: 'transparent',
    color: '#fff',
    border: '1px solid #fff',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  body: { padding: '24px' },
  statsGrid: { display: 'flex', gap: '16px' },
  statCard: {
    flex: 1,
    background: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    textAlign: 'center',
  },
  statValue: { fontSize: '32px', fontWeight: 700, color: '#1677ff' },
  statLabel: { fontSize: '14px', color: '#666', marginTop: '8px' },
}
