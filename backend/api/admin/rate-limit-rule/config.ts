import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'rate-limit-rule',
  permissions: [
    { code: 'rateLimit:admin:rule:list', name: '查看限流规则列表', description: '获取限流规则列表' },
    { code: 'rateLimit:admin:rule:read', name: '查看限流规则详情', description: '获取限流规则详情' },
    { code: 'rateLimit:admin:rule:create', name: '创建限流规则', description: '创建新限流规则' },
    { code: 'rateLimit:admin:rule:update', name: '更新限流规则', description: '更新限流规则' },
    { code: 'rateLimit:admin:rule:delete', name: '删除限流规则', description: '删除限流规则' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
  menus: [
    { name: '限流保护', path: '/rate-limit', icon: 'shield', type: 1, sort: 8, redirect: '/rate-limit/rules' },
    { name: '限流规则', path: '/rate-limit/rules', parent: '/rate-limit', component: 'admin/rate-limit/RateLimitRules', icon: 'setting', sort: 1, permCode: 'rateLimit:admin:rule:list' },
  ],
})
