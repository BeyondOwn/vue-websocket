import { toast, type ToastTheme } from 'vue3-toastify'
import { useTheme } from './UseTheme'

export const copyToClipboard = (text: string) => {
  const { theme } = useTheme()
  console.log('from clip: ', theme.value, Date.now())
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Optional: Add a toast or notification
      console.log('Copied to clipboard')
      toast(`Copied to clipboard!`, { autoClose: 3000, type: 'success', theme: theme.value as ToastTheme })
    })
    .catch((err) => {
      console.error('Failed to copy: ', err)
    })
}
