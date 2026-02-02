import type { SeedFn } from '../seed-log'

/** Session 种子数据（启动时清空过期会话） */
const seed: SeedFn = async () => {
  // 会话表不需要预设种子数据
  // 启动时会自动加载有效会话到内存
  return { count: 0 }
}

export default seed
