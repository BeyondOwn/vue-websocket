<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import './components/DrawerWithForm.vue'
import './globals.css'
import AuthProvider from './lib/AuthProvider.vue'
</script>

<template>
  <div class="dark bg-background text-foreground">
    <header class="h-[30px]">
      <div class="wrapper">
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/login">Login</RouterLink>
        </nav>
      </div>
    </header>
    <AuthProvider>
      <RouterView />
    </AuthProvider>
  </div>
</template>

<style scoped></style>
