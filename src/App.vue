<script setup lang="ts">
import { RouterView } from 'vue-router'
import './components/DrawerWithForm.vue'
import Navbar from './components/Navbar.vue'
import './globals.css'
import AuthProvider from './lib/AuthProvider.vue'
import { useTheme } from './lib/UseTheme'
useTheme()
</script>

<template>
  <div :class="['bg-background  text-foreground']">
    <AuthProvider>
      <Navbar />
      <RouterView />
    </AuthProvider>
  </div>
</template>

<style scoped></style>
