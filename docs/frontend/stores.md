# 状态管理

## authStore

认证状态管理（Pinia Store），管理用户登录状态、权限信息和菜单树。

### 状态

```typescript
const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null as UserInfo | null,
    permissions: [] as string[],
    menuTree: [] as MenuItem[],
    initialized: false,
  }),
})
```

### 核心方法

| 方法 | 说明 |
|------|------|
| `login(username, password)` | 登录，保存 token |
| `logout()` | 登出，清除状态 |
| `register(data)` | 注册 |
| `init()` | 初始化（加载用户信息+权限+菜单+动态路由） |
| `fetchUserInfo()` | 获取当前用户信息 |
| `fetchPermissions()` | 获取权限列表 |
| `fetchMenuTree()` | 获取菜单树 |

### 权限检查

```typescript
const authStore = useAuthStore()

// 检查单个权限
authStore.hasPermission('user:admin:list')

// 检查任一权限
authStore.hasAnyPermission(['user:admin:list', 'user:admin:read'])

// 检查所有权限
authStore.hasAllPermissions(['user:admin:list', 'user:admin:create'])
```

### Token 持久化

```typescript
// 登录成功后
localStorage.setItem('token', token)
this.token = token

// 登出时
localStorage.removeItem('token')
this.token = ''
```

## 在组件中使用

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 响应式访问
const username = computed(() => authStore.userInfo?.username)
const isAdmin = computed(() => authStore.hasPermission('admin'))
</script>

<template>
  <span>{{ authStore.userInfo?.nickname }}</span>
  <button v-if="authStore.hasPermission('user:admin:create')">
    新增用户
  </button>
</template>
```
