import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'rbac',
  name: '管理 - RBAC权限',
  description: 'RBAC权限管理接口',
  permissions: [
    { code: 'rbac:admin:roles-tree', name: '查看角色列表', description: '获取所有角色（扁平列表）' },
    { code: 'rbac:admin:cache-status', name: '查看缓存状态', description: '获取RBAC缓存状态' },
    { code: 'rbac:admin:cache-reload', name: '重载RBAC缓存', description: '重新加载RBAC缓存' },
    { code: 'rbac:admin:role-permissions', name: '查看角色权限', description: '获取角色权限列表' },
    { code: 'rbac:admin:permission-check', name: '权限检查', description: '检查单个权限' },
    { code: 'rbac:admin:permission-check-any', name: '权限任一检查', description: '检查是否拥有任一权限' },
    { code: 'rbac:admin:permission-check-all', name: '权限全部检查', description: '检查是否拥有所有权限' },
    { code: 'rbac:admin:role-menus', name: '查看角色菜单', description: '获取角色菜单列表' },
    { code: 'rbac:admin:role-menus-tree', name: '查看角色菜单树', description: '获取角色菜单树' },
    { code: 'rbac:admin:role-scopes', name: '查看角色数据规则', description: '获取角色数据规则' },
    { code: 'rbac:admin:role-scopes-ssql', name: '查看角色SSQL规则', description: '获取角色SSQL规则' },
    { code: 'rbac:admin:user-info', name: '查看用户RBAC信息', description: '获取用户RBAC详细信息' },
    { code: 'rbac:admin:user-permission-check', name: '用户权限检查', description: '检查用户单个权限' },
    { code: 'rbac:admin:user-permission-check-any', name: '用户权限任一检查', description: '检查用户是否拥有任一权限' },
    { code: 'rbac:admin:user-menus-tree', name: '查看用户菜单树', description: '获取用户菜单树' },
    { code: 'rbac:admin:user-scopes-table', name: '查看用户表规则', description: '获取用户表级数据规则' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
  menus: [
    { name: '权限配置', path: '/rbac', icon: 'security', type: 1, sort: 2 },
    { name: '缓存管理', path: '/rbac/cache', parent: '/rbac', component: 'admin/rbac/Cache', icon: 'cache', sort: 2, permCode: 'rbac:admin:cache-status' },
  ],
})
