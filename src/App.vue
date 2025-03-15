<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import './globals.css'
</script>

<template>
  <div class="dark bg-background text-foreground">
    <header class="h-[20px]">
      <div class="wrapper">
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>

<style scoped></style>
