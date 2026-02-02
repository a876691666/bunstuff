import type { SeedDefinition } from '@/modules/seed/main/service'

// 登录日志表无需初始化数据
export const loginLogSeed: SeedDefinition = {
  name: 'login-log-init',
  description: '登录日志表初始化（无数据）',
  async run() {
    // 登录日志表不需要初始化数据
  },
}
