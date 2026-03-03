import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'role',
  permissions: [
    { code: 'role:admin:list', name: '查看角色列表', description: '获取角色列表' },
    { code: 'role:admin:tree', name: '查看角色树', description: '获取角色树形结构' },
    { code: 'role:admin:read', name: '查看角色详情', description: '获取角色详情' },
    { code: 'role:admin:create', name: '创建角色', description: '创建新角色' },
    { code: 'role:admin:update', name: '更新角色', description: '更新角色信息' },
    { code: 'role:admin:delete', name: '删除角色', description: '删除角色' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['role:admin:list', 'role:admin:tree', 'role:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'role', permission: 'role:admin:list', rule: 'status = 1', description: '仅查看启用角色' },
    { role: 'user', table: 'role', permission: 'role:admin:tree', rule: 'status = 1', description: '仅查看启用角色' },
    { role: 'user', table: 'role', permission: 'role:admin:read', rule: 'status = 1', description: '仅查看启用角色' },
  ],
})
