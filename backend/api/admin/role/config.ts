import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'role',
  name: '管理 - 角色',
  description: '角色管理接口',
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
  },
  menus: [
    { name: '系统管理', path: '/system', icon: 'setting', type: 1, sort: 1 },
    { name: '角色管理', path: '/system/roles', parent: '/system', component: 'admin/system/Roles', icon: 'peoples', sort: 2, permCode: 'role:admin:list' },
  ],
})
