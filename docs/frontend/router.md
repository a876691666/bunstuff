# 路由系统

## 🎯 概述

路由系统分为 **静态路由** 和 **动态路由** 两部分。静态路由在应用初始化时注册，动态路由根据用户权限从后端菜单树生成。

## 📋 静态路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | `Login.vue` | 登录/注册页 |
| `/dashboard` | `Dashboard.vue` | 仪表盘首页 |
| `/profile` | `Profile.vue` | 个人资料 |
| `/change-password` | `ChangePassword.vue` | 修改密码 |
| `/:pathMatch(.*)*` | `NotFound.vue` | 404 兜底页 |

```ts
const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/dashboard/Index.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/auth/Profile.vue') },
      { path: 'change-password', name: 'ChangePassword', component: () => import('../views/auth/ChangePassword.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
]
```

## 🔄 动态路由

动态路由基于后端返回的菜单树（MenuTree）自动生成。

### 菜单类型

| type | 含义 | 路由处理 |
|------|------|----------|
| 1 | 目录 | 生成嵌套路由容器 |
| 2 | 页面 | 生成叶子路由，懒加载对应组件 |
| 3 | 按钮 | **跳过**，不生成路由 |

### 生成流程

```
后端 /rbac/my/menus/tree
        ↓
  authStore.fetchMenuTree()
        ↓
  generateRoutes(menuTree)
        ↓
  router.addRoute(route)
```

### 组件懒加载

使用 `import.meta.glob` 自动收集所有视图组件：

```ts
// 收集所有 views 下的 .vue 文件
const modules = import.meta.glob('../views/**/*.vue')

// 根据菜单路径匹配组件
function resolveComponent(path: string) {
  const componentPath = `../views${path}.vue`
  return modules[componentPath] || modules[`../views${path}/Index.vue`]
}
```

### generateRoutes 核心逻辑

```ts
function generateRoutes(menuTree: MenuItem[]): RouteRecordRaw[] {
  return menuTree
    .filter(item => item.type !== 3) // 跳过按钮类型
    .map(item => {
      const route: RouteRecordRaw = {
        path: item.path,
        name: item.name,
        meta: { title: item.title, icon: item.icon },
        component: item.type === 1
          ? () => import('../layouts/RouterView.vue')  // 目录 → 容器
          : resolveComponent(item.component),           // 页面 → 实际组件
        children: item.children ? generateRoutes(item.children) : []
      }
      return route
    })
}
```

## 🛡️ 路由守卫

```ts
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. 未登录用户 → 跳转 /login
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    return next('/login')
  }

  // 2. 已登录访问 /login → 跳转 /dashboard
  if (to.path === '/login' && authStore.isLoggedIn) {
    return next('/dashboard')
  }

  // 3. 首次进入：初始化用户信息和动态路由
  if (authStore.isLoggedIn && !authStore.initialized) {
    await authStore.init()
    return next({ ...to, replace: true }) // 重新导航以匹配动态路由
  }

  next()
})
```

### 守卫流程图

```
请求路由
  ├─ 未登录 & 需要认证 → /login
  ├─ 已登录 & 访问 /login → /dashboard
  ├─ 已登录 & 未初始化 → init() → 重新导航
  └─ 正常放行
```

:::tip
`authStore.init()` 会依次调用 `fetchUserInfo()`、`fetchPermissions()`、`fetchMenuTree()`，并将菜单树转为动态路由注册到 router 中。
:::

:::warning
动态路由在页面刷新时会丢失，因此守卫中通过 `initialized` 标志判断是否需要重新加载。刷新后会自动从后端重新拉取菜单数据。
:::
