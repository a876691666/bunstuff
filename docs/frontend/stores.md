# 状态管理

## 🎯 概述

项目使用 **Pinia 3.0** 进行状态管理，目前核心 Store 为 `useAuthStore`，负责用户认证、权限控制和菜单管理。

## 📦 useAuthStore

### State 定义

| 字段 | 类型 | 说明 |
|------|------|------|
| `user` | `UserInfo \| null` | 当前登录用户信息 |
| `permissions` | `string[]` | 用户权限标识列表 |
| `menuTree` | `MenuItem[]` | 后端返回的菜单树 |
| `isLoggedIn` | `boolean` | 是否已登录（computed，基于 token 是否存在） |
| `initialized` | `boolean` | 是否已初始化（用户信息 + 权限 + 菜单已加载） |

### Token 存储

Token 存储在 `localStorage` 中，通过 HttpClient 的 `setToken` / `getToken` 方法管理：

```ts
// 登录后保存
localStorage.setItem('token', response.token)

// 请求时自动携带
headers: { Authorization: `Bearer ${getToken()}` }

// 登出时清除
localStorage.removeItem('token')
```

:::tip
`isLoggedIn` 是计算属性，直接判断 `localStorage` 中是否存在 token，而非依赖响应式状态。这保证了页面刷新后状态的正确性。
:::

### Methods 一览

| 方法 | 说明 | 调用的 API |
|------|------|-----------|
| `login(credentials)` | 用户登录，保存 token | `POST /auth/login` |
| `register(data)` | 用户注册 | `POST /auth/register` |
| `logout()` | 登出，清除所有状态 | `POST /auth/logout` |
| `fetchUserInfo()` | 获取当前用户信息 | `GET /auth/me` |
| `fetchPermissions()` | 获取权限标识列表 | `GET /rbac/my/permissions` |
| `fetchMenuTree()` | 获取菜单树并注册动态路由 | `GET /rbac/my/menus/tree` |
| `hasPermission(perm)` | 检查是否拥有某个权限 | - |
| `hasAnyPermission(perms)` | 检查是否拥有任一权限 | - |
| `init()` | 初始化：依次加载用户信息、权限、菜单 | - |

### 核心方法实现

```ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])
  const menuTree = ref<MenuItem[]>([])
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!getToken())

  async function login(credentials: LoginForm) {
    const res = await authApi.login(credentials)
    setToken(res.token)
    await init()
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      setToken('')
      user.value = null
      permissions.value = []
      menuTree.value = []
      initialized.value = false
      router.push('/login')
    }
  }

  async function init() {
    if (initialized.value) return
    await fetchUserInfo()
    await fetchPermissions()
    await fetchMenuTree()
    initialized.value = true
  }

  // ...

  return {
    user, permissions, menuTree, isLoggedIn, initialized,
    login, register, logout, fetchUserInfo, fetchPermissions,
    fetchMenuTree, hasPermission, hasAnyPermission, init
  }
})
```

### 权限检查

```ts
function hasPermission(perm: string): boolean {
  return permissions.value.includes(perm)
}

function hasAnyPermission(perms: string[]): boolean {
  return perms.some(p => permissions.value.includes(p))
}
```

在模板中使用：

```vue
<template>
  <!-- 按钮级权限控制 -->
  <NButton v-if="authStore.hasPermission('user:create')" @click="handleCreate">
    新增用户
  </NButton>
</template>
```

### 初始化流程

```
应用启动 / 页面刷新
  ↓
路由守卫检测 isLoggedIn && !initialized
  ↓
authStore.init()
  ├─ fetchUserInfo()     → GET /auth/me
  ├─ fetchPermissions()  → GET /rbac/my/permissions
  └─ fetchMenuTree()     → GET /rbac/my/menus/tree
       ↓
  addDynamicRoutes(menuTree)  → router.addRoute(...)
       ↓
  initialized = true → 重新导航
```

:::warning
`init()` 内部有幂等保护（`if (initialized.value) return`），不会重复执行。登出时务必重置 `initialized = false`，确保下次登录时重新初始化。
:::
