# 路由系统

## 路由类型

管理端使用两种路由：

- **静态路由**：在代码中直接定义（登录、404 等固定页面）
- **动态路由**：根据后端菜单树在运行时生成

## 静态路由

```typescript
// router/index.ts
const routes = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'profile', component: Profile },
      { path: 'change-password', component: ChangePassword },
    ],
  },
  { path: '/:pathMatch(.*)*', component: NotFound },
]
```

## 动态路由

### 菜单到路由的转换

```typescript
// router/dynamic.ts

// 预加载所有视图组件
const modules = import.meta.glob('../views/**/*.vue')

// 递归生成路由
function generateRoutes(menuTree: MenuItem[]): RouteRecordRaw[] {
  return menuTree
    .filter(menu => menu.type !== 3)  // 排除按钮类型
    .map(menu => ({
      path: menu.path,
      name: menu.name,
      component: menu.component
        ? modules[`../views/${menu.component}.vue`]
        : undefined,
      redirect: menu.redirect,
      meta: {
        title: menu.name,
        icon: menu.icon,
        permissions: menu.permCode ? [menu.permCode] : [],
      },
      children: menu.children ? generateRoutes(menu.children) : [],
    }))
}

// 添加动态路由
export function addDynamicRoutes(menuTree: MenuItem[]) {
  const routes = generateRoutes(menuTree)
  routes.forEach(route => {
    router.addRoute('Layout', route)  // 添加到 Layout 路由下
  })
}
```

### 菜单数据结构

```typescript
interface MenuItem {
  id: number
  parentId: number
  name: string          // 菜单名称
  path: string          // 路由路径
  component: string     // 组件路径（相对于 views/）
  icon: string          // 图标
  type: number          // 1=目录 2=菜单 3=按钮
  visible: number       // 是否显示
  redirect: string      // 重定向
  sort: number          // 排序
  permCode: string      // 权限编码
  children: MenuItem[]  // 子菜单
}
```

## 路由守卫

```typescript
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  
  // 1. 登录页直接放行
  if (to.path === '/login') return true
  
  // 2. 无 Token → 跳转登录
  if (!authStore.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  
  // 3. 未初始化 → 加载用户信息和动态路由
  if (!authStore.initialized) {
    await authStore.init()
    // 重新导航（因为动态路由已添加）
    return { ...to, replace: true }
  }
  
  return true
})
```

### 初始化流程

```
authStore.init()
  → fetchUserInfo()          获取用户信息
  → fetchPermissions()       获取权限列表
  → fetchMenuTree()          获取菜单树
  → addDynamicRoutes(menus)  注入动态路由
  → initialized = true
```
