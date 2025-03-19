<!-- AuthProvider.vue -->
<template>
  <slot v-if="!loading"></slot>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import { createAuthProvider } from './authContext'

// Create and provide the auth context
const { loading } = createAuthProvider()
</script>
