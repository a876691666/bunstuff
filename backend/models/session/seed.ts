import type { SeedDefinition } from '@/modules/seed'

/** Session 种子数据（启动时清空过期会话） */
const seed: SeedDefinition = {
  name: 'session-cleanup',
  description: '会话表不需要预设种子数据',
  async run() {
    // 会话表不需要预设种子数据
    // 启动时会自动加载有效会话到内存
  },
}

export default seed
