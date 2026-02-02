import type { SeedDefinition } from '../../modules/seed/service'

/** 用户资源使用表 Seed（空，无需初始数据） */
export const userResourceUsageSeed: SeedDefinition = {
  name: 'user-resource-usage-default',
  description: '用户资源使用表无需初始数据',
  async run() {
    console.log('✅ 用户资源使用表无需初始数据')
  },
}

export default userResourceUsageSeed
