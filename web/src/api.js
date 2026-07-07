import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// 请求拦截器：注入 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(data.message || data.error || '请求失败'))
    }
    if (error.request) {
      return Promise.reject(new Error('网络错误，请检查网络连接'))
    }
    return Promise.reject(error)
  }
)

export default api
