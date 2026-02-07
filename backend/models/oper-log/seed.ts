import type { SeedDefinition } from '@/modules/seed/main/service'

/** 操作日志表 Seed（无初始数据） */
export const operLogSeed: SeedDefinition = {
  name: 'oper-log-init',
  description: '操作日志表初始化（无数据）',
  async run() {
    // 操作日志表不需要初始化数据
  },
}
