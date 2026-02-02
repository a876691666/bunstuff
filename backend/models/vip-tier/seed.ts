import type { SeedDefinition } from '../../modules/seed/service'
import VipTier from './index'

/** 默认 VIP 等级数据 */
const defaultVipTiers = [
  {
    name: '免费版',
    code: 'free',
    roleId: null,
    price: 0,
    durationDays: 0,
    status: 1,
    description: '免费用户，基础功能',
  },
  {
    name: '专业版',
    code: 'pro',
    roleId: null,
    price: 99,
    durationDays: 30,
    status: 1,
    description: '专业用户，更多功能与配额',
  },
  {
    name: '企业版',
    code: 'enterprise',
    roleId: null,
    price: 299,
    durationDays: 30,
    status: 1,
    description: '企业用户，无限制功能',
  },
]

/** VIP 等级表 Seed */
export const vipTierSeed: SeedDefinition = {
  name: 'vip-tier-default',
  description: '初始化默认 VIP 等级数据',
  async run() {
    for (const tier of defaultVipTiers) {
      await VipTier.create(tier)
    }
    console.log(`✅ 已创建 ${defaultVipTiers.length} 个默认 VIP 等级`)
  },
}

export default vipTierSeed
