import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'users',
  permissions: [
    { code: 'user:admin:list', name: '查看用户列表', description: '获取用户列表' },
    { code: 'user:admin:read', name: '查看用户详情', description: '获取用户详情' },
    { code: 'user:admin:create', name: '创建用户', description: '创建新用户' },
    { code: 'user:admin:update', name: '更新用户', description: '更新用户信息' },
    { code: 'user:admin:delete', name: '删除用户', description: '删除用户' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['user:admin:list', 'user:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'users', permission: 'user:admin:list', rule: 'id = $auth.userId', description: '仅查看本人信息' },
    { role: 'user', table: 'users', permission: 'user:admin:read', rule: 'id = $auth.userId', description: '仅查看本人信息' },
  ],
  menus: [
    { name: '系统管理', path: '/system', icon: 'setting', type: 1, sort: 1, redirect: '/system/users' },
    { name: '用户管理', path: '/system/users', parent: '/system', component: 'admin/system/Users', icon: 'user', sort: 1, permCode: 'user:admin:list' },
  ],
})
