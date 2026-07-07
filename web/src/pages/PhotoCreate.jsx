import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function PhotoCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '' })
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) {
      setError('请输入标题')
      return
    }
    if (files.length === 0) {
      setError('请至少选择一张图片')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('content', form.content.trim())
      files.forEach((f) => formData.append('images', f))

      const res = await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const photoId = res.data.photo?._id || res.data._id
      navigate(photoId ? `/photos/${photoId}` : '/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backRow}>
        <Link to="/" style={styles.backLink}>← 返回首页</Link>
      </div>
      <div style={styles.card}>
        <h1 style={styles.title}>发布游记</h1>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>标题 *</label>
            <input
              style={styles.input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="游记标题"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>内容</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="写下你的游记..."
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>图片 *</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} style={styles.fileInput} />
            {previews.length > 0 && (
              <div style={styles.previewGrid}>
                {previews.map((p, i) => (
                  <img key={i} src={p} alt={`preview-${i}`} style={styles.previewImage} />
                ))}
              </div>
            )}
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} disabled={loading}>
            {loading ? '发布中...' : '发布游记'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '20px' },
  backRow: { marginBottom: '16px' },
  backLink: { color: '#1677ff', textDecoration: 'none', fontSize: '14px' },
  card: { background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  title: { fontSize: '24px', fontWeight: 700, color: '#333', margin: '0 0 32px 0' },
  field: { marginBottom: '24px' },
  label: { display: 'block', fontSize: '14px', color: '#666', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
  textarea: { minHeight: '150px', resize: 'vertical' },
  fileInput: { fontSize: '14px', color: '#666' },
  previewGrid: { display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' },
  previewImage: { width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' },
  error: { color: '#e74c3c', fontSize: '13px', marginBottom: '12px' },
  btn: { width: '100%', padding: '12px', fontSize: '16px', color: '#fff', background: '#1677ff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
}
