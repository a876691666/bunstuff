import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'ip-blacklist',
  name: '管理 - IP黑名单',
  description: 'IP黑名单管理接口',
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
  },
  menus: [
    { name: '限流保护', path: '/rate-limit', icon: 'shield', type: 1, sort: 8 },
    { name: 'IP黑名单', path: '/rate-limit/blacklist', parent: '/rate-limit', component: 'admin/rate-limit/IpBlacklist', icon: 'lock', sort: 2, permCode: 'rateLimit:admin:blacklist:list' },
  ],
})
