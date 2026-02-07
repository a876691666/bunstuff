import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { generateRoutes } from './dynamic'
import type { MenuTree } from '@/types'

// 布局组件
import { AdminLayout } from '@/layouts'

// 认证页面
import { Login, ChangePassword, Profile } from '@/views/auth'

/** 静态路由 - 无需权限 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    name: 'Layout',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '个人信息' },
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: ChangePassword,
        meta: { title: '修改密码' },
      },
    ],
  },
  // 404
]

const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/NotFound.vue'),
  meta: { title: '页面不存在', public: true },
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/** 已添加的动态路由名称集合 */
const dynamicRouteNames = new Set<string>()

/** 根据菜单树生成并注入动态路由（在 fetchMenuTree 后调用） */
export function addDynamicRoutes(menuTree: MenuTree[]) {
  // 先清理旧的动态路由
  resetDynamicRoutes()

  const dynamicRoutes = generateRoutes(menuTree)
  for (const route of dynamicRoutes) {
    router.addRoute('Layout', route)
    if (route.name) dynamicRouteNames.add(route.name as string)
    // 收集子路由名称
    collectChildNames(route)
  }

  // 确保 404 路由在最后
  if (!router.hasRoute('NotFound')) {
    router.addRoute(notFoundRoute)
  }
}

function collectChildNames(route: RouteRecordRaw) {
  if (route.children) {
    for (const child of route.children) {
      if (child.name) dynamicRouteNames.add(child.name as string)
      collectChildNames(child)
    }
  }
}

/** 重置动态路由（登出时调用） */
export function resetDynamicRoutes() {
  for (const name of dynamicRouteNames) {
    router.removeRoute(name)
  }
  dynamicRouteNames.clear()
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || '后台管理系统'

  // 检查是否需要登录
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录用户访问登录页，跳转到首页
  if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
    return
  }

  // 有 token 时，确保已初始化用户信息（init 内部会获取菜单并注入路由）
  if (token) {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    if (!authStore.isLoggedIn) {
      await authStore.init()
      // init 完成后动态路由已注入，重新匹配当前路径
      next({ ...to, replace: true })
      return
    }
  }

  next()
})

export default router
