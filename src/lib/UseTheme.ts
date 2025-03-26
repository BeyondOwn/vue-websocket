import { onMounted, ref, watch } from 'vue'

const theme = ref('light')
const isDark = ref(false)

export function useTheme() {
  onMounted(() => {
    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      theme.value = savedTheme
      isDark.value = savedTheme === 'dark'
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
      isDark.value = prefersDark
    }

    // Apply theme on initial load
    applyTheme()

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        // Only auto-switch if user hasn't set a preference
        const newTheme = e.matches ? 'dark' : 'light'
        theme.value = newTheme
        isDark.value = e.matches
        applyTheme()
      }
    })
  })

  // Watch for theme changes
  watch(theme, (newTheme) => {
    isDark.value = newTheme === 'dark'
    localStorage.setItem('theme', newTheme)
    applyTheme()
    // console.log('from inside: ', newTheme)
  })

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(newTheme: string) {
    if (newTheme === 'dark' || newTheme === 'light') {
      theme.value = newTheme
    }
  }

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
