import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import PhotoDetail from './pages/PhotoDetail'
import PhotoCreate from './pages/PhotoCreate'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/photos/:id" element={<PhotoDetail />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <PhotoCreate />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
