import type { SeedDefinition } from '@/modules/seed/main/service'
import Job from './index'

/** 定时任务表 Seed */
export const jobSeed: SeedDefinition = {
  name: 'job-init',
  description: '初始化默认定时任务',
  async run() {
    // 任务会通过 jobService.registerCron() 自动同步入库
    console.log('✅ 定时任务初始化完成（任务通过代码注册自动同步）')
  },
}
