import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function UserManage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 10

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login')
      return
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [page, keyword])

  const fetchUsers = async () => {
    try {
      const params = { page, pageSize }
      if (keyword) params.keyword = keyword
      const res = await api.get('/admin/user/list', { params })
      setUsers(res.data.list || [])
      setTotal(res.data.total || 0)
    } catch {
      setUsers([])
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(searchInput.trim())
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <h1 style={styles.logo}>乌东文旅 · 管理后台</h1>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>控制台</a>
          <a href="/photos" style={styles.navLink}>游记管理</a>
          <a href="/users" style={{ ...styles.navLink, ...styles.navLinkActive }}>用户管理</a>
        </nav>
        <div>
          <span style={styles.userName}>{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login') }} style={styles.logoutBtn}>退出</button>
        </div>
      </header>
      <div style={styles.body}>
        <form onSubmit={handleSearch} style={styles.searchBox}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="搜索用户名或昵称..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" style={styles.searchBtn}>搜索</button>
        </form>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>用户名</th>
              <th style={styles.th}>昵称</th>
              <th style={styles.th}>角色</th>
              <th style={styles.th}>注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.username}</td>
                <td style={styles.td}>{u.nickname || '-'}</td>
                <td style={styles.td}>{u.role || 'user'}</td>
                <td style={styles.td}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={styles.pageBtn}>上一页</button>
            <span style={{ margin: '0 12px', fontSize: '13px', color: '#666' }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={styles.pageBtn}>下一页</button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  layout: { minHeight: '100vh', background: '#f0f2f5' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: '56px', background: '#001529', color: '#fff',
  },
  logo: { fontSize: '16px', fontWeight: 600 },
  nav: { display: 'flex', gap: '4px' },
  navLink: { color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '0 16px', fontSize: '14px' },
  navLinkActive: { color: '#fff', fontWeight: 600 },
  userName: { fontSize: '14px', marginRight: '12px' },
  logoutBtn: {
    padding: '4px 12px', fontSize: '13px', background: 'transparent',
    color: '#fff', border: '1px solid #fff', borderRadius: '4px', cursor: 'pointer',
  },
  body: { padding: '24px' },
  searchBox: { display: 'flex', gap: '8px', marginBottom: '16px' },
  searchInput: {
    padding: '8px 12px', fontSize: '13px', border: '1px solid #d9d9d9',
    borderRadius: '4px', width: '240px', outline: 'none',
  },
  searchBtn: {
    padding: '8px 16px', fontSize: '13px', border: 'none',
    background: '#1677ff', color: '#fff', borderRadius: '4px', cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', color: '#666' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '13px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' },
  pageBtn: {
    padding: '6px 14px', fontSize: '13px', border: '1px solid #d9d9d9',
    background: '#fff', borderRadius: '4px', cursor: 'pointer',
  },
}
