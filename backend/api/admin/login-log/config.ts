import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'login-log',
  permissions: [
    { code: 'loginLog:admin:list', name: '查看登录日志列表', description: '获取登录日志列表' },
    { code: 'loginLog:admin:read', name: '查看登录日志详情', description: '获取登录日志详情' },
    { code: 'loginLog:admin:delete', name: '删除登录日志', description: '删除登录日志' },
    { code: 'loginLog:admin:clear', name: '清空登录日志', description: '清空所有登录日志' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
  menus: [
    { name: '日志管理', path: '/log', icon: 'log', type: 1, sort: 6 },
    { name: '登录日志', path: '/log/login', parent: '/log', component: 'admin/system/LoginLogs', icon: 'login', sort: 2, permCode: 'loginLog:admin:list' },
  ],
})
