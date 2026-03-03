import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'seed',
  permissions: [
    { code: 'seed:admin:list', name: '查看Seed列表', description: '获取已注册的Seed列表' },
    { code: 'seed:admin:logs', name: '查看Seed日志', description: '获取Seed执行日志' },
    { code: 'seed:admin:run', name: '执行Seed', description: '执行单个Seed' },
    { code: 'seed:admin:run-all', name: '执行所有Seed', description: '执行所有Seed' },
    { code: 'seed:admin:reset', name: '重置Seed', description: '重置Seed执行记录' },
  ],
  roles: {
    'super-admin': '*',
  },
})
