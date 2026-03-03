import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'config',
  permissions: [
    { code: 'config:admin:list', name: '查看配置列表', description: '获取系统配置列表' },
    { code: 'config:admin:read', name: '查看配置详情', description: '获取系统配置详情' },
    { code: 'config:admin:create', name: '创建系统配置', description: '创建新系统配置' },
    { code: 'config:admin:update', name: '更新系统配置', description: '更新系统配置' },
    { code: 'config:admin:delete', name: '删除系统配置', description: '删除系统配置' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['config:admin:list', 'config:admin:read'],
  },
  scopes: [
    { role: 'admin', table: 'sys_config', permission: 'config:admin:update', rule: 'isBuiltin = 0', description: '管理员不可修改内置配置' },
    { role: 'admin', table: 'sys_config', permission: 'config:admin:delete', rule: 'isBuiltin = 0', description: '管理员不可删除内置配置' },
    { role: 'user', table: 'sys_config', permission: 'config:admin:list', rule: 'isBuiltin = 1', description: '仅查看内置公共配置' },
    { role: 'user', table: 'sys_config', permission: 'config:admin:read', rule: 'isBuiltin = 1', description: '仅查看内置公共配置' },
  ],
  menus: [
    { name: '系统管理', path: '/system', icon: 'setting', type: 1, sort: 1 },
    { name: '参数配置', path: '/system/configs', parent: '/system', component: 'admin/system/Configs', icon: 'config', sort: 8, permCode: 'config:admin:list' },
  ],
})
