import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password.trim() || !form.nickname.trim()) {
      setError('请填写所有必填字段')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    if (form.password.length < 6) {
      setError('密码长度至少6位')
      return
    }
    setLoading(true)
    try {
      await register(form.username, form.password, form.nickname)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>注册</h1>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>用户名 *</label>
            <input style={styles.input} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="请输入用户名" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>昵称 *</label>
            <input style={styles.input} value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="请输入昵称" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>密码 *</label>
            <input style={styles.input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="至少6位密码" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>确认密码 *</label>
            <input style={styles.input} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="再次输入密码" />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <div style={styles.footer}>
          已有账号？<Link to="/login">去登录</Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: '400px' },
  title: { fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '32px', color: '#333' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', color: '#666', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
  error: { color: '#e74c3c', fontSize: '13px', marginBottom: '12px' },
  btn: { width: '100%', padding: '12px', fontSize: '16px', color: '#fff', background: '#1677ff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, marginTop: '4px' },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#999' },
}
