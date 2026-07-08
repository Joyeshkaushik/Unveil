import axios from 'axios'

// Use local server for development, deployed for production
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:5000/api'
    :' https://unveil-backend-1cqg.onrender.com/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle rate limit and auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      // Rate limit exceeded
      const retryAfter = error.response.headers['retry-after']
      error.response.data.error = retryAfter
        ? `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
        : error.response.data.error || 'Rate limit exceeded. Please try again later.'
    }
    if (error.response?.status === 401) {
      // Only handle 401 for protected routes, not login/signup
      const isAuthRoute = error.config?.url?.includes('/auth/login') ||
                          error.config?.url?.includes('/auth/signup')
      if (!isAuthRoute) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api