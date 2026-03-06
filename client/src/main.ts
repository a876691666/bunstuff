import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import 'virtual:uno.css'
import './assets/main.css'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 无需登录即可访问
const PUBLIC_PATHS = ['/', '/login', '/register']
// 登录后不应访问（访客页）
const GUEST_ONLY_PATHS = ['/login', '/register']

router.beforeEach((to) => {
  const token = localStorage.getItem('auth_token')
  if (!token && !PUBLIC_PATHS.includes(to.path)) {
    return '/login'
  }
  if (token && GUEST_ONLY_PATHS.includes(to.path)) {
    return '/space'
  }
})

const app = createApp(App)
app.use(router)

await router.isReady()
app.mount('#app')
