import axios from 'axios'

// Backend teammate owns this base URL — update if their local port differs.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the backend ever returns 401, drop the stale token so the next
// protected request redirects to login instead of looping silently.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('transitops_token')
      localStorage.removeItem('transitops_user')
    }
    return Promise.reject(err)
  }
)
