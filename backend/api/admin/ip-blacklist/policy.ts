import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'ip-blacklist',
  permissions: [
    { code: 'rateLimit:admin:blacklist:list', name: '查看IP黑名单列表', description: '获取IP黑名单列表' },
    { code: 'rateLimit:admin:blacklist:read', name: '查看IP黑名单详情', description: '获取IP黑名单详情' },
    { code: 'rateLimit:admin:blacklist:create', name: '添加IP黑名单', description: '手动添加IP到黑名单' },
    { code: 'rateLimit:admin:blacklist:update', name: '更新IP黑名单', description: '更新IP黑名单/解封' },
    { code: 'rateLimit:admin:blacklist:delete', name: '删除IP黑名单', description: '删除IP黑名单记录' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['rateLimit:admin:blacklist:list', 'rateLimit:admin:blacklist:read'],
  },
  scopes: [
    { role: 'user', table: 'ip_blacklist', permission: 'rateLimit:admin:blacklist:list', rule: 'status = 1', description: '仅查看生效中黑名单' },
    { role: 'user', table: 'ip_blacklist', permission: 'rateLimit:admin:blacklist:read', rule: 'status = 1', description: '仅查看生效中黑名单' },
  ],
})
