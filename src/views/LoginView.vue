<script setup lang="ts">
import { useAuth } from '@/lib/authContext'
import { watchEffect } from 'vue'

function GoogleAuth() {
  window.location.href = `http://localhost:3000/auth/google`
}

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
</script>

<template>
  <div class="bg-red-500">
    <button class="" @click="GoogleAuth">Google</button>
  </div>
</template>
