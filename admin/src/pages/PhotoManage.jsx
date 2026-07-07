import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const STATUS_MAP = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]

export default function PhotoManage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const pageSize = 10

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login')
      return
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [page, statusFilter])

  const fetchPhotos = async () => {
    try {
      const params = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/admin/photo/list', { params })
      setPhotos(res.data.list || [])
      setTotal(res.data.total || 0)
    } catch {
      setPhotos([])
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/photo/${id}/approve`)
      fetchPhotos()
    } catch {}
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      await api.post(`/admin/photo/${rejectModal}/reject`, { reason: rejectReason })
      setRejectModal(null)
      setRejectReason('')
      fetchPhotos()
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除这篇游记？')) return
    try {
      await api.delete(`/admin/photo/${id}`)
      fetchPhotos()
    } catch {}
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <h1 style={styles.logo}>乌东文旅 · 管理后台</h1>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>控制台</a>
          <a href="/photos" style={{ ...styles.navLink, ...styles.navLinkActive }}>游记管理</a>
          <a href="/users" style={styles.navLink}>用户管理</a>
        </nav>
        <div>
          <span style={styles.userName}>{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login') }} style={styles.logoutBtn}>退出</button>
        </div>
      </header>
      <div style={styles.body}>
        <div style={styles.toolbar}>
          <div style={styles.filterGroup}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                style={{
                  ...styles.filterBtn,
                  background: statusFilter === opt.value ? '#1677ff' : '#fff',
                  color: statusFilter === opt.value ? '#fff' : '#333',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>标题</th>
              <th style={styles.th}>作者</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>创建时间</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((p) => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}>{p.id}</td>
                <td style={styles.td}>{p.title}</td>
                <td style={styles.td}>{p.author || '-'}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusTag,
                    ...(p.status === 'approved' ? styles.tagApproved : {}),
                    ...(p.status === 'rejected' ? styles.tagRejected : {}),
                    ...(p.status === 'pending' ? styles.tagPending : {}),
                  }}>
                    {STATUS_MAP[p.status] || p.status}
                  </span>
                </td>
                <td style={styles.td}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                <td style={styles.td}>
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(p.id)} style={styles.actionBtnApprove}>通过</button>
                      <button onClick={() => setRejectModal(p.id)} style={styles.actionBtnReject}>驳回</button>
                    </>
                  )}
                  <button onClick={() => handleDelete(p.id)} style={styles.actionBtnDelete}>删除</button>
                </td>
              </tr>
            ))}
            {photos.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>暂无数据</td>
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

      {rejectModal && (
        <div style={styles.modalOverlay} onClick={() => setRejectModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>输入驳回原因</h3>
            <textarea
              style={styles.textarea}
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写驳回原因..."
            />
            <div style={styles.modalActions}>
              <button onClick={() => setRejectModal(null)} style={styles.cancelBtn}>取消</button>
              <button onClick={handleReject} style={styles.confirmBtn}>确认驳回</button>
            </div>
          </div>
        </div>
      )}
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
  toolbar: { marginBottom: '16px' },
  filterGroup: { display: 'flex', gap: '8px' },
  filterBtn: {
    padding: '6px 16px', fontSize: '13px', border: '1px solid #d9d9d9',
    borderRadius: '4px', cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', color: '#666' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '13px' },
  statusTag: { padding: '2px 8px', borderRadius: '4px', fontSize: '12px' },
  tagApproved: { background: '#f6ffed', color: '#52c41a' },
  tagRejected: { background: '#fff2f0', color: '#ff4d4f' },
  tagPending: { background: '#fffbe6', color: '#faad14' },
  actionBtnApprove: {
    padding: '4px 10px', fontSize: '12px', border: '1px solid #52c41a',
    color: '#52c41a', background: '#fff', borderRadius: '4px', cursor: 'pointer', marginRight: '6px',
  },
  actionBtnReject: {
    padding: '4px 10px', fontSize: '12px', border: '1px solid #faad14',
    color: '#faad14', background: '#fff', borderRadius: '4px', cursor: 'pointer', marginRight: '6px',
  },
  actionBtnDelete: {
    padding: '4px 10px', fontSize: '12px', border: '1px solid #ff4d4f',
    color: '#ff4d4f', background: '#fff', borderRadius: '4px', cursor: 'pointer',
  },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' },
  pageBtn: {
    padding: '6px 14px', fontSize: '13px', border: '1px solid #d9d9d9',
    background: '#fff', borderRadius: '4px', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  modal: { background: '#fff', padding: '24px', borderRadius: '8px', width: '420px' },
  modalTitle: { fontSize: '16px', marginBottom: '16px' },
  textarea: { width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
  cancelBtn: { padding: '6px 16px', fontSize: '13px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '4px', cursor: 'pointer' },
  confirmBtn: { padding: '6px 16px', fontSize: '13px', border: 'none', background: '#ff4d4f', color: '#fff', borderRadius: '4px', cursor: 'pointer' },
}
