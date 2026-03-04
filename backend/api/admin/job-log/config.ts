import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'job-log',
  name: '管理 - 任务日志',
  description: '定时任务执行日志接口',
  permissions: [
    { code: 'jobLog:admin:list', name: '查看任务日志', description: '获取任务执行日志列表' },
    { code: 'jobLog:admin:read', name: '查看任务日志详情', description: '获取任务日志详情' },
    { code: 'jobLog:admin:delete', name: '删除任务日志', description: '删除任务执行日志' },
    { code: 'jobLog:admin:clear', name: '清空任务日志', description: '清空任务执行日志' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
  menus: [
    { name: '日志管理', path: '/log', icon: 'log', type: 1, sort: 6 },
    { name: '任务日志', path: '/log/job', parent: '/log', component: 'admin/job/JobLogs', icon: 'log', sort: 3, permCode: 'jobLog:admin:list' },
  ],
})
