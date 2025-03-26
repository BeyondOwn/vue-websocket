<script setup lang="ts">
import { RouterView } from 'vue-router'
import './components/DrawerWithForm.vue'
import './globals.css'
import AuthProvider from './lib/AuthProvider.vue'
import { useTheme } from './lib/UseTheme'
useTheme()
</script>

<template>
  <div :class="['bg-background  text-foreground']">
    <!-- <div class="wrapper">
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/login">Login</RouterLink>
        </nav>
      </div> -->
    <AuthProvider>
      <RouterView />
    </AuthProvider>
  </div>
</template>

<style scoped></style>
