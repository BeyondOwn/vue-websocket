import { createPinia } from 'pinia'
import { createApp } from 'vue'
import './globals.css'

import App from './App.vue'
import AuthProvider from './lib/AuthProvider.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('AuthProvider', AuthProvider)
app.mount('#app')
