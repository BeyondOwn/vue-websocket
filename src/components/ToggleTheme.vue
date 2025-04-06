<template>
  <Button @click="toggleTheme" class="gap-0 max-w-8 max-h-8 items-center justify-baseline p-0 ml-0 space-x-2" variant="ghost">
    <span>{{ isDark ? 'Light' : 'Dark' }} Mode</span>
    <SunIcon v-if="isDark" class="h-5 w-5 text-foreground" />
    <MoonIcon v-else class="h-5 w-5 text-foreground" />
  </Button>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/UseTheme'
import { MoonIcon, SunIcon } from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()
</script>
