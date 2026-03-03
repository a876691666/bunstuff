import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'auth',
  permissions: [
    { code: 'auth:admin:stats', name: '查看认证统计', description: '获取认证统计信息' },
    { code: 'auth:admin:sessions', name: '查看会话列表', description: '获取所有会话列表' },
    { code: 'auth:admin:kick-user', name: '踢出用户', description: '踢出指定用户所有会话' },
    { code: 'auth:admin:kick-session', name: '踢出会话', description: '踢出指定会话' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
})
