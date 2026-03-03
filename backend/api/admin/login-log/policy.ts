import { definePolicy } from '@/core/policy'

export default definePolicy({
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
    'user': ['loginLog:admin:list', 'loginLog:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'login_log', permission: 'loginLog:admin:list', rule: 'userId = $auth.userId', description: '仅查看本人登录日志' },
    { role: 'user', table: 'login_log', permission: 'loginLog:admin:read', rule: 'userId = $auth.userId', description: '仅查看本人登录日志' },
  ],
})
