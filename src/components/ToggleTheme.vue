<template>
  <Button @click="toggleTheme" class="flex items-center gap-2" variant="outline">
    <SunIcon v-if="isDark" class="h-5 w-5" />
    <MoonIcon v-else class="h-5 w-5" />
    <span>{{ isDark ? 'Light' : 'Dark' }} Mode</span>
  </Button>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/UseTheme'
import { MoonIcon, SunIcon } from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()
</script>
