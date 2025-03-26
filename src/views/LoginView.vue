<script setup lang="ts">
import { useAuth } from '@/lib/authContext'
import api from '@/lib/axios'
import { ref, watchEffect } from 'vue'
import { toast } from 'vue3-toastify'

const email = ref('')
const password = ref('')

function GoogleAuth() {
  window.location.href = `http://localhost:3000/auth/google`
}

const { setAuthData } = useAuth()

watchEffect(() => {
  const { setAuthData, user } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const userData = params.get('userData')
  console.log(user)
  if (token && userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData))
      if (user && token) {
        setAuthData(token, user)
        window.history.replaceState({}, document.title, window.location.pathname)
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }
})

const simulateLogin = async (email: string, password) => {
  // const { setAuthData, user } = useAuth()

  const nameGroup = email.match(/^(.*?)@/)
  const name = nameGroup?.[1]
  const loginResponse = await api.post('/auth-email', { email, name, password })
  if (loginResponse.status == 201) {
    toast(`${loginResponse.data.user.name} account created!`, { autoClose: 5000, type: 'info', theme: 'dark' })
    console.log(loginResponse.data)
  }
  if (loginResponse.status == 200) {
    toast(`Login successfull!`, { autoClose: 5000, type: 'success', theme: 'dark' })

    setAuthData(loginResponse.data.token, loginResponse.data.user)
    console.log(loginResponse.data)
    window.location.href = '/'
  }
}
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-card border-border border-2 text-card-foreground shadow-lg rounded-lg p-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-foreground">Log in or sign up</h2>
      </div>
      <div class="space-y-4">
        <button @click="GoogleAuth" class="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-background text-secondary-foreground hover:bg-background/90 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-ring">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg" alt="Google logo" class="mr-2 h-5 w-5" />
          Continue with Google
        </button>

        <div class="flex items-center justify-center">
          <div class="w-full border-t border-border"></div>
          <span class="px-3 bg-background/90 text-muted-foreground text-sm">OR</span>
          <div class="w-full border-t border-border"></div>
        </div>

        <input type="email" v-model="email" placeholder="Email address" class="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary" />
        <input type="password" v-model="password" placeholder="Password" class="w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary" />
        <button @click="() => simulateLogin(email, password)" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-ring">Continue with email</button>
      </div>

      <div class="text-center text-xs text-muted-foreground">
        By continuing, you acknowledge that you have read, understood, and agree to our
        <a href="#" class="underline hover:text-primary">Terms & Conditions</a>
        and <a href="#" class="underline hover:text-primary">Privacy Policy</a>
      </div>
    </div>
  </div>
</template>
