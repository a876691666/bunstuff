import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'vip',
  permissions: [
    // VIP 等级
    { code: 'vip:admin:tier:list', name: '查看VIP等级列表', description: '获取VIP等级列表' },
    { code: 'vip:admin:tier:read', name: '查看VIP等级详情', description: '获取VIP等级详情' },
    { code: 'vip:admin:tier:create', name: '创建VIP等级', description: '创建VIP等级' },
    { code: 'vip:admin:tier:update', name: '更新VIP等级', description: '更新VIP等级信息' },
    { code: 'vip:admin:tier:delete', name: '删除VIP等级', description: '删除VIP等级' },
    // 资源限制
    { code: 'vip:admin:resource-limit:list', name: '查看资源限制列表', description: '获取VIP资源限制列表' },
    { code: 'vip:admin:resource-limit:create', name: '创建资源限制', description: '创建VIP资源限制' },
    { code: 'vip:admin:resource-limit:update', name: '更新资源限制', description: '更新VIP资源限制' },
    { code: 'vip:admin:resource-limit:delete', name: '删除资源限制', description: '删除VIP资源限制' },
    // 用户 VIP
    { code: 'vip:admin:user:list', name: '查看用户VIP列表', description: '获取用户VIP列表' },
    { code: 'vip:admin:user:read', name: '查看用户VIP详情', description: '获取用户VIP详情' },
    { code: 'vip:admin:user:upgrade', name: '升级用户VIP', description: '升级用户VIP等级' },
    { code: 'vip:admin:user:upgrade-direct', name: '直接升级用户VIP', description: '直接升级用户VIP等级' },
    { code: 'vip:admin:user:confirm', name: '确认VIP绑定', description: '确认或取消VIP绑定' },
    { code: 'vip:admin:user:cancel', name: '取消用户VIP', description: '取消用户VIP' },
    // 资源使用
    { code: 'vip:admin:resource:check', name: '检查资源使用', description: '检查用户资源使用情况' },
    { code: 'vip:admin:resource:increment', name: '增加资源使用', description: '增加用户资源使用量' },
    { code: 'vip:admin:resource:usage', name: '查看资源使用详情', description: '获取用户资源使用详情' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': [
      'vip:admin:tier:list', 'vip:admin:tier:read',
      'vip:admin:user:list', 'vip:admin:user:read',
    ],
  },
  scopes: [
    { role: 'user', table: 'vip_tier', permission: 'vip:admin:tier:list', rule: 'status = 1', description: '仅查看启用VIP等级' },
    { role: 'user', table: 'vip_tier', permission: 'vip:admin:tier:read', rule: 'status = 1', description: '仅查看启用VIP等级' },
    { role: 'user', table: 'user_vip', permission: 'vip:admin:user:list', rule: 'userId = $auth.userId', description: '仅查看本人VIP信息' },
    { role: 'user', table: 'user_vip', permission: 'vip:admin:user:read', rule: 'userId = $auth.userId', description: '仅查看本人VIP信息' },
  ],
  menus: [
    { name: 'VIP管理', path: '/vip', icon: 'vip', type: 1, sort: 3, redirect: '/vip/tiers' },
    { name: 'VIP等级', path: '/vip/tiers', parent: '/vip', component: 'admin/vip/Tiers', icon: 'tier', sort: 1, permCode: 'vip:admin:tier:list' },
    { name: '用户VIP', path: '/vip/users', parent: '/vip', component: 'admin/vip/Users', icon: 'vip-user', sort: 2, permCode: 'vip:admin:user:list' },
    { name: '资源限制', path: '/vip/resource-limits', parent: '/vip', component: 'admin/vip/ResourceLimits', icon: 'resource', sort: 3, permCode: 'vip:admin:resource-limit:list' },
  ],
})
