import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'job',
  permissions: [
    { code: 'job:admin:list', name: '查看任务列表', description: '获取定时任务列表' },
    { code: 'job:admin:read', name: '查看任务详情', description: '获取定时任务详情' },
    { code: 'job:admin:create', name: '创建定时任务', description: '创建新定时任务' },
    { code: 'job:admin:update', name: '更新定时任务', description: '更新定时任务配置' },
    { code: 'job:admin:delete', name: '删除定时任务', description: '删除定时任务' },
    { code: 'job:admin:run', name: '手动触发任务', description: '手动触发执行定时任务' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['job:admin:list', 'job:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'job', permission: 'job:admin:list', rule: 'status = 1', description: '仅查看运行中任务' },
    { role: 'user', table: 'job', permission: 'job:admin:read', rule: 'status = 1', description: '仅查看运行中任务' },
  ],
  menus: [
    { name: '定时任务', path: '/job', icon: 'job', type: 1, sort: 7, redirect: '/job/list' },
    { name: '任务管理', path: '/job/list', parent: '/job', component: 'admin/job/Jobs', icon: 'list', sort: 1, permCode: 'job:admin:list' },
  ],
})
