import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { authApi, rbacApi } from '@/api'
import { http } from '@/utils'
import type { User, MenuTree, LoginRequest, RegisterRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null)
  const permissions = shallowRef<string[]>([])
  const menuTree = shallowRef<MenuTree[]>([])
  const isLoggedIn = shallowRef(false)

  /** 登录 */
  async function login(data: LoginRequest) {
    const res = await authApi.login(data)
    http.setToken(res.token)
    await fetchUserInfo()
    return res
  }

  /** 注册 */
  async function register(data: RegisterRequest) {
    return authApi.register(data)
  }

  /** 登出 */
  async function logout() {
    try {
      await authApi.logout()
    } finally {
      http.setToken(null)
      user.value = null
      permissions.value = []
      menuTree.value = []
      isLoggedIn.value = false
    }
  }

  /** 获取用户信息 */
  async function fetchUserInfo() {
    try {
      const res = await authApi.me()
      user.value = res
      isLoggedIn.value = true
      // 获取权限和菜单
      await Promise.all([fetchPermissions(), fetchMenuTree()])
    } catch {
      isLoggedIn.value = false
      user.value = null
    }
  }

  /** 获取权限列表 */
  async function fetchPermissions() {
    try {
      const res = await rbacApi.getMyPermissions()
      permissions.value = res
    } catch {
      permissions.value = []
    }
  }

  /** 获取菜单树 */
  async function fetchMenuTree() {
    try {
      const res = await rbacApi.getMyMenuTree()
      menuTree.value = res
    } catch {
      menuTree.value = []
    }
  }

  /** 检查是否有权限 */
  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  /** 检查是否有任一权限 */
  function hasAnyPermission(codes: string[]): boolean {
    return codes.some((code) => permissions.value.includes(code))
  }

  /** 检查是否有所有权限 */
  function hasAllPermissions(codes: string[]): boolean {
    return codes.every((code) => permissions.value.includes(code))
  }

  /** 初始化（检查已有token） */
  async function init() {
    const token = http.getToken()
    if (token) {
      await fetchUserInfo()
    }
  }

  return {
    user,
    permissions,
    menuTree,
    isLoggedIn,
    login,
    register,
    logout,
    fetchUserInfo,
    fetchPermissions,
    fetchMenuTree,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    init,
  }
})
