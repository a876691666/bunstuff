import { ref, shallowRef } from 'vue'
import type { LoginResult } from '@/api/auth'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function loadUser(): LoginResult['user'] | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const authToken = ref(localStorage.getItem(TOKEN_KEY) ?? '')
export const authUser = shallowRef<LoginResult['user'] | null>(loadUser())

export function setAuth(result: LoginResult) {
  authToken.value = result.token
  authUser.value = result.user
  localStorage.setItem(TOKEN_KEY, result.token)
  localStorage.setItem(USER_KEY, JSON.stringify(result.user))
}

export function clearAuth() {
  authToken.value = ''
  authUser.value = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn() {
  return !!authToken.value
}
