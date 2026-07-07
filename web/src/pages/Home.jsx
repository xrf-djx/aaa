import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/photos', { params: { page, limit: 12, search } })
      setPhotos(res.data.photos || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleLike = async (photoId) => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await api.post(`/photos/${photoId}/like`)
      setPhotos((prev) =>
        prev.map((p) =>
          p._id === photoId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
      )
    } catch {
      // silent
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link to="/" style={styles.logo}>乌东文旅</Link>
          <div style={styles.headerRight}>
            {user ? (
              <>
                <Link to="/create" style={styles.createBtn}>发布游记</Link>
                <span style={styles.userInfo}>{user.nickname || user.username}</span>
                <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload() }} style={styles.logoutBtn}>退出</button>
              </>
            ) : (
              <Link to="/login" style={styles.loginLink}>登录</Link>
            )}
          </div>
        </div>
      </header>

      {/* 搜索 */}
      <form style={styles.searchBar} onSubmit={handleSearch}>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索游记..."
        />
        <button style={styles.searchBtn} type="submit">搜索</button>
      </form>

      {/* 内容 */}
      {loading && <div style={styles.loading}>加载中...</div>}
      {error && <div style={styles.error}>{error}</div>}
      {!loading && !error && photos.length === 0 && (
        <div style={styles.empty}>暂无游记内容</div>
      )}
      {!loading && !error && photos.length > 0 && (
        <>
          <div style={styles.grid}>
            {photos.map((photo) => (
              <Link to={`/photos/${photo._id}`} key={photo._id} style={styles.card}>
                <div style={styles.cardImageWrap}>
                  {photo.images && photo.images.length > 0 ? (
                    <img src={photo.images[0]} alt={photo.title} style={styles.cardImage} />
                  ) : (
                    <div style={styles.cardPlaceholder}>暂无图片</div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{photo.title}</h3>
                  <div style={styles.cardMeta}>
                    <span style={styles.author}>{photo.author?.nickname || photo.author?.username || '匿名'}</span>
                    <span style={styles.likes}>
                      <button
                        onClick={(e) => { e.preventDefault(); handleLike(photo._id) }}
                        style={{ ...styles.likeBtn, color: photo.liked ? '#e74c3c' : '#999' }}
                      >
                        {photo.liked ? '❤' : '♡'} {photo.likes || 0}
                      </button>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* 分页 */}
          <div style={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={styles.pageBtn}>上一页</button>
            <span style={styles.pageInfo}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={styles.pageBtn}>下一页</button>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  header: { borderBottom: '1px solid #eee', padding: '16px 0', marginBottom: '24px' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '22px', fontWeight: 700, color: '#333', textDecoration: 'none' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  createBtn: { padding: '8px 20px', background: '#1677ff', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' },
  userInfo: { fontSize: '14px', color: '#666' },
  logoutBtn: { background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px', color: '#999' },
  loginLink: { padding: '8px 20px', background: '#1677ff', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' },
  searchBar: { display: 'flex', gap: '12px', marginBottom: '24px' },
  searchInput: { flex: 1, padding: '10px 16px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none' },
  searchBtn: { padding: '10px 24px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '80px 0', color: '#999', fontSize: '16px' },
  error: { textAlign: 'center', padding: '40px 0', color: '#e74c3c', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '80px 0', color: '#999', fontSize: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s' },
  cardImageWrap: { height: '200px', overflow: 'hidden', background: '#f0f0f0' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover' },
  cardPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: '14px' },
  cardBody: { padding: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: '#333', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#999' },
  author: {},
  likes: {},
  likeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '40px 0' },
  pageBtn: { padding: '8px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#333' },
  pageInfo: { fontSize: '14px', color: '#666' },
}
