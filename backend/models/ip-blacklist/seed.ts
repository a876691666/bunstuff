import type { SeedDefinition } from '@/modules/seed'

/** IP黑名单 Seed（初始为空） */
export const ipBlacklistSeed: SeedDefinition = {
  name: 'ip-blacklist-default',
  description: '初始化IP黑名单表（无默认数据）',
  async run() {
    console.log('✅ IP黑名单表已就绪（无默认数据）')
  },
}

export default ipBlacklistSeed
