import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'oper-log',
  permissions: [
    { code: 'operLog:admin:list', name: '查看操作日志列表', description: '获取操作日志列表' },
    { code: 'operLog:admin:read', name: '查看操作日志详情', description: '获取操作日志详情' },
    { code: 'operLog:admin:delete', name: '删除操作日志', description: '删除操作日志' },
    { code: 'operLog:admin:clear', name: '清空操作日志', description: '清空所有操作日志' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['operLog:admin:list', 'operLog:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'oper_log', permission: 'operLog:admin:list', rule: 'userId = $auth.userId', description: '仅查看本人操作日志' },
    { role: 'user', table: 'oper_log', permission: 'operLog:admin:read', rule: 'userId = $auth.userId', description: '仅查看本人操作日志' },
  ],
  menus: [
    { name: '日志管理', path: '/log', icon: 'log', type: 1, sort: 6, redirect: '/log/oper' },
    { name: '操作日志', path: '/log/oper', parent: '/log', component: 'admin/system/OperLogs', icon: 'edit', sort: 1, permCode: 'operLog:admin:list' },
  ],
})
