import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function PhotoDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/photos/${id}`)
        setPhoto(res.data.photo || res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await api.post(`/photos/${id}/like`)
      setPhoto((prev) => ({
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1,
      }))
    } catch {
      // silent
    }
  }

  if (loading) return <div style={styles.status}>加载中...</div>
  if (error) return <div style={styles.status}>{error}</div>
  if (!photo) return <div style={styles.status}>未找到游记</div>

  return (
    <div style={styles.container}>
      <div style={styles.backRow}>
        <Link to="/" style={styles.backLink}>← 返回首页</Link>
      </div>
      <article style={styles.article}>
        <h1 style={styles.title}>{photo.title}</h1>
        <div style={styles.meta}>
          <span>{photo.author?.nickname || photo.author?.username || '匿名'}</span>
          {photo.createdAt && (
            <span style={styles.date}>{new Date(photo.createdAt).toLocaleDateString('zh-CN')}</span>
          )}
        </div>

        {/* 图片画廊 */}
        {photo.images && photo.images.length > 0 && (
          <div style={styles.gallery}>
            {photo.images.map((img, i) => (
              <img key={i} src={img} alt={`${photo.title} - ${i + 1}`} style={styles.galleryImage} />
            ))}
          </div>
        )}

        {/* 文字内容 */}
        {photo.content && (
          <div style={styles.content}>{photo.content}</div>
        )}

        {/* 点赞 */}
        <div style={styles.likeRow}>
          <button onClick={handleLike} style={{ ...styles.likeBtn, color: photo.liked ? '#e74c3c' : '#999' }}>
            {photo.liked ? '❤' : '♡'} 点赞 {photo.likes || 0}
          </button>
        </div>
      </article>
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
  status: { textAlign: 'center', padding: '80px 0', color: '#999', fontSize: '16px' },
  backRow: { marginBottom: '20px' },
  backLink: { color: '#1677ff', textDecoration: 'none', fontSize: '14px' },
  article: { background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  title: { fontSize: '26px', fontWeight: 700, color: '#333', margin: '0 0 12px 0' },
  meta: { display: 'flex', gap: '16px', fontSize: '14px', color: '#999', marginBottom: '24px' },
  date: {},
  gallery: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' },
  galleryImage: { width: '100%', borderRadius: '8px', maxHeight: '500px', objectFit: 'cover' },
  content: { fontSize: '15px', lineHeight: 1.8, color: '#444', marginBottom: '24px', whiteSpace: 'pre-wrap' },
  likeRow: { borderTop: '1px solid #eee', paddingTop: '20px' },
  likeBtn: { background: 'none', border: '1px solid #ddd', borderRadius: '20px', padding: '8px 24px', cursor: 'pointer', fontSize: '14px' },
}
