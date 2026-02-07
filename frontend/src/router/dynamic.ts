import type { RouteRecordRaw } from 'vue-router'
import type { MenuTree } from '@/types'

/**
 * 使用 import.meta.glob 预加载所有 views 下的 .vue 组件
 * key 格式: /src/views/admin/system/Users.vue
 */
const viewModules = import.meta.glob('../views/**/*.vue')

/**
 * 根据 component 字段解析出懒加载组件
 * component 值示例: 'admin/system/Users' → 对应 ../views/admin/system/Users.vue
 *                    'Dashboard' → 对应 ../views/Dashboard.vue
 */
function resolveComponent(component: string) {
  const path = `../views/${component}.vue`
  const loader = viewModules[path]
  if (!loader) {
    console.warn(`[router] 未找到组件: ${component} (path: ${path})`)
    return undefined
  }
  return loader
}

/**
 * 从完整 path 中提取最后一段作为子路由 path
 * 例如: '/system/users' → 'users', '/dashboard' → 'dashboard'
 */
function getChildPath(fullPath: string): string {
  const segments = fullPath.replace(/^\//, '').split('/')
  return segments[segments.length - 1] || fullPath
}

/**
 * 为路由生成唯一名称
 * 例如: '/system/users' → 'SystemUsers', '/log/oper' → 'LogOper'
 */
function generateRouteName(path: string): string {
  return path
    .replace(/^\//, '')
    .split('/')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
    .replace(/-(\w)/g, (_, c) => c.toUpperCase())
}

/**
 * 将后端菜单树转换为 Vue Router 动态路由
 * 只处理 type=1(目录) 和 type=2(页面)
 */
export function generateRoutes(menuTree: MenuTree[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const menu of menuTree) {
    // 跳过按钮 (type=3) 和禁用菜单 (status != 1)
    if (menu.type === 3) continue

    // type=1: 目录，有子菜单
    if (menu.type === 1 && menu.children?.length) {
      const childRoutes = generateRoutes(menu.children)
      const dirRoute: RouteRecordRaw = {
        path: getChildPath(menu.path),
        name: generateRouteName(menu.path),
        redirect: menu.redirect || undefined,
        meta: { title: menu.name },
        children: childRoutes,
      }
      routes.push(dirRoute)
    }

    // type=2: 页面，有 component
    if (menu.type === 2 && menu.component) {
      const component = resolveComponent(menu.component)
      if (component) {
        routes.push({
          path: getChildPath(menu.path),
          name: generateRouteName(menu.path),
          component,
          meta: { title: menu.name },
        })
      }
    }
  }

  return routes
}
