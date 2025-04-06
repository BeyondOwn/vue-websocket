import axios from 'axios'
import { toast, type ToastTheme } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useTheme } from './UseTheme'

export const BACKEND = 'websocket-api-production.up.railway.app'

const { theme } = useTheme()

const api = axios.create({
  baseURL: BACKEND,
  withCredentials: true,
  timeout: 5000, // 5 second timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If the error is a network error
    if (error.code === 'ERR_NETWORK') {
      toast('Unable to connect to server. Please check your connection.', { autoClose: 5000, type: 'error', theme: theme.value as ToastTheme })

      // Retry the request up to 3 times
      if (!originalRequest._retry) {
        originalRequest._retry = 1
      } else if (originalRequest._retry < 3) {
        originalRequest._retry++
      } else {
        return Promise.reject(error)
      }

      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return api(originalRequest)
    }

    // If the error is a 401 (Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // window.location.href = '/login'
      toast(`${error.response?.data?.message || error.response.data.error || 'An error occurred'}`, { autoClose: 5000, type: 'error', theme: theme.value as ToastTheme })
      return Promise.reject(error)
    }

    // If the error is a 403 (Forbidden)
    if (error.response?.status === 403) {
      toast('You do not have permission to perform this action', { autoClose: 5000, type: 'error', theme: theme.value as ToastTheme })
      return Promise.reject(error)
    }

    // For all other errors
    toast(error.response?.data?.message || error.response.data.error || 'An error occurred', { autoClose: 5000, type: 'error', theme: theme.value as ToastTheme })
    return Promise.reject(error)
  },
)

export default api
