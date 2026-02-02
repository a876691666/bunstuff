import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 布局组件
import { AdminLayout } from '@/layouts'

// 认证页面
import { Login, ChangePassword, Profile } from '@/views/auth'

// 系统管理页面
import {
  Users,
  Roles,
  Permissions,
  PermissionScopes,
  Menus,
  DictTypes,
  DictData,
  Configs,
  LoginLogs,
} from '@/views/admin/system'

// RBAC页面
import { RoleMenus, RolePermissions, Sessions, Cache } from '@/views/admin/rbac'

// VIP页面
import { Tiers as VipTiers, Users as VipUsers, ResourceLimits } from '@/views/admin/vip'

// 通知公告页面
import { Notices } from '@/views/admin/notice'

// 文件管理页面
import { Files } from '@/views/admin/file'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
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
      // 系统管理
      {
        path: 'system',
        name: 'System',
        redirect: '/system/users',
        meta: { title: '系统管理' },
        children: [
          {
            path: 'users',
            name: 'SystemUsers',
            component: Users,
            meta: { title: '用户管理' },
          },
          {
            path: 'roles',
            name: 'SystemRoles',
            component: Roles,
            meta: { title: '角色管理' },
          },
          {
            path: 'permissions',
            name: 'SystemPermissions',
            component: Permissions,
            meta: { title: '权限管理' },
          },
          {
            path: 'permission-scopes',
            name: 'SystemPermissionScopes',
            component: PermissionScopes,
            meta: { title: '数据权限' },
          },
          {
            path: 'menus',
            name: 'SystemMenus',
            component: Menus,
            meta: { title: '菜单管理' },
          },
          {
            path: 'dict-types',
            name: 'SystemDictTypes',
            component: DictTypes,
            meta: { title: '字典类型' },
          },
          {
            path: 'dict-data',
            name: 'SystemDictData',
            component: DictData,
            meta: { title: '字典数据' },
          },
          {
            path: 'configs',
            name: 'SystemConfigs',
            component: Configs,
            meta: { title: '参数配置' },
          },
          {
            path: 'login-logs',
            name: 'SystemLoginLogs',
            component: LoginLogs,
            meta: { title: '登录日志' },
          },
        ],
      },
      // RBAC管理
      {
        path: 'rbac',
        name: 'RBAC',
        redirect: '/rbac/role-menus',
        meta: { title: '权限配置' },
        children: [
          {
            path: 'role-menus',
            name: 'RBACRoleMenus',
            component: RoleMenus,
            meta: { title: '角色菜单' },
          },
          {
            path: 'role-permissions',
            name: 'RBACRolePermissions',
            component: RolePermissions,
            meta: { title: '角色权限' },
          },
          {
            path: 'sessions',
            name: 'RBACSessions',
            component: Sessions,
            meta: { title: '会话管理' },
          },
          {
            path: 'cache',
            name: 'RBACCache',
            component: Cache,
            meta: { title: '缓存管理' },
          },
        ],
      },
      // VIP管理
      {
        path: 'vip',
        name: 'VIP',
        redirect: '/vip/tiers',
        meta: { title: 'VIP管理' },
        children: [
          {
            path: 'tiers',
            name: 'VipTiers',
            component: VipTiers,
            meta: { title: 'VIP等级' },
          },
          {
            path: 'users',
            name: 'VipUsers',
            component: VipUsers,
            meta: { title: '用户VIP' },
          },
          {
            path: 'resource-limits',
            name: 'VipResourceLimits',
            component: ResourceLimits,
            meta: { title: '资源限制' },
          },
        ],
      },
      // 通知公告
      {
        path: 'notice',
        name: 'Notice',
        redirect: '/notice/list',
        meta: { title: '通知公告' },
        children: [
          {
            path: 'list',
            name: 'NoticeList',
            component: Notices,
            meta: { title: '公告管理' },
          },
        ],
      },
      // 文件管理
      {
        path: 'file',
        name: 'File',
        redirect: '/file/list',
        meta: { title: '文件管理' },
        children: [
          {
            path: 'list',
            name: 'FileList',
            component: Files,
            meta: { title: '文件列表' },
          },
        ],
      },
    ],
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在', public: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
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

  next()
})

export default router
