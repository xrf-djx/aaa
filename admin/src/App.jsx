import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PhotoManage from './pages/PhotoManage'
import UserManage from './pages/UserManage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/photos" element={<PhotoManage />} />
      <Route path="/users" element={<UserManage />} />
    </Routes>
  )
}
