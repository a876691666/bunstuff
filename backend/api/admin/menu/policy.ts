import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'menu',
  permissions: [
    { code: 'menu:admin:list', name: '查看菜单列表', description: '获取菜单列表' },
    { code: 'menu:admin:tree', name: '查看菜单树', description: '获取菜单树形结构' },
    { code: 'menu:admin:read', name: '查看菜单详情', description: '获取菜单详情' },
    { code: 'menu:admin:create', name: '创建菜单', description: '创建新菜单' },
    { code: 'menu:admin:update', name: '更新菜单', description: '更新菜单信息' },
    { code: 'menu:admin:delete', name: '删除菜单', description: '删除菜单' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['menu:admin:list', 'menu:admin:tree', 'menu:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'menu', permission: 'menu:admin:list', rule: 'status = 1', description: '仅查看启用菜单' },
    { role: 'user', table: 'menu', permission: 'menu:admin:tree', rule: 'status = 1', description: '仅查看启用菜单' },
    { role: 'user', table: 'menu', permission: 'menu:admin:read', rule: 'status = 1', description: '仅查看启用菜单' },
  ],
})
