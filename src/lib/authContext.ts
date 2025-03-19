// authContext.ts
import { inject, onMounted, provide, ref, type Ref } from 'vue'

// User interface
interface User {
  id: string
  googleId: string
  name: string
  email: string
  picture: string
}

// Auth context interface
interface AuthContextType {
  user: Ref<User | null>
  loading: Ref<boolean>
  token: Ref<string | null>
  setAuthData: (token: string, userData: User) => void
  logout: () => void
}

// Symbol for injection key
const AuthSymbol = Symbol('auth')

// Create auth context
export function createAuthProvider() {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref<boolean>(true)

  onMounted(() => {
    // Check localStorage on initial load
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }

    loading.value = false
  })

  const setAuthData = (newToken: string, userData: User) => {
    // Save to localStorage
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))

    // Update state
    token.value = newToken
    user.value = userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    token.value = null
    user.value = null
    window.location.href = '/login'
  }

  // Create context object
  const authContext: AuthContextType = {
    user,
    loading,
    token,
    setAuthData,
    logout,
  }

  // Provide the auth context
  provide(AuthSymbol, authContext)

  return authContext
}

// Custom composable to use the auth context
export function useAuth(): AuthContextType {
  const authContext = inject<AuthContextType>(AuthSymbol)

  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return authContext
}
