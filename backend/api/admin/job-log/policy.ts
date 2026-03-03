import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'job-log',
  permissions: [
    { code: 'jobLog:admin:list', name: '查看任务日志', description: '获取任务执行日志列表' },
    { code: 'jobLog:admin:read', name: '查看任务日志详情', description: '获取任务日志详情' },
    { code: 'jobLog:admin:delete', name: '删除任务日志', description: '删除任务执行日志' },
    { code: 'jobLog:admin:clear', name: '清空任务日志', description: '清空任务执行日志' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['jobLog:admin:list', 'jobLog:admin:read'],
  },
  scopes: [
    { role: 'user', table: 'job_log', permission: 'jobLog:admin:list', rule: 'status = 1', description: '仅查看成功任务日志' },
    { role: 'user', table: 'job_log', permission: 'jobLog:admin:read', rule: 'status = 1', description: '仅查看成功任务日志' },
  ],
})
