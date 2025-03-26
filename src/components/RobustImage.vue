<template>
  <img :src="displayedSrc" :alt="alt" :class="[className, { 'opacity-50': loadFailed }]" class="transition-opacity duration-300" @error="handleImageError" />
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
  timeout: {
    type: Number,
    default: 3000, // 3 seconds default timeout
  },
  fallbackSrc: {
    type: String,
    default: '/api/placeholder/96/96', // Placeholder image
  },
})

const displayedSrc = ref(props.src)
const loadFailed = ref(false)
console.log(displayedSrc)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadTimer: any = null

const handleImageError = () => {
  clearTimeout(loadTimer)
  loadFailed.value = true
  displayedSrc.value = props.fallbackSrc
}

const startLoadTimer = () => {
  // Clear any existing timer
  if (loadTimer) {
    clearTimeout(loadTimer)
  }

  // Reset states
  loadFailed.value = false
  displayedSrc.value = props.src

  // Set new load timer
  loadTimer = setTimeout(() => {
    if (!loadFailed.value) {
      handleImageError()
    }
  }, props.timeout)
}

// Watch for src changes
watch(() => props.src, startLoadTimer)

// Start timer on component mount
onMounted(startLoadTimer)

// Clean up timer on unmount
onUnmounted(() => {
  if (loadTimer) {
    clearTimeout(loadTimer)
  }
})
</script>
