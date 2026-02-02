import type { SeedDefinition } from '../../modules/seed/service'
import VipResourceLimit from './index'
import VipTier from '../vip-tier'
import { where } from '@pkg/ssql'

/** VIP 资源限制 Seed */
export const vipResourceLimitSeed: SeedDefinition = {
  name: 'vip-resource-limit-default',
  description: '初始化默认 VIP 资源限制数据',
  dependencies: ['vip-tier-default'],
  async run() {
    // 获取 VIP 等级
    const freeTier = await VipTier.findOne({ where: where().eq('code', 'free') })
    const proTier = await VipTier.findOne({ where: where().eq('code', 'pro') })
    const enterpriseTier = await VipTier.findOne({ where: where().eq('code', 'enterprise') })

    if (!freeTier || !proTier || !enterpriseTier) {
      console.log('⚠️ 未找到 VIP 等级，跳过资源限制初始化')
      return
    }

    const defaultLimits = [
      // 免费版限制
      {
        vipTierId: freeTier.id,
        resourceKey: 'scene:create',
        limitValue: 5,
        description: '可创建场景数',
      },
      {
        vipTierId: freeTier.id,
        resourceKey: 'project:create',
        limitValue: 3,
        description: '可创建项目数',
      },
      {
        vipTierId: freeTier.id,
        resourceKey: 'storage:mb',
        limitValue: 100,
        description: '存储空间(MB)',
      },
      // 专业版限制
      {
        vipTierId: proTier.id,
        resourceKey: 'scene:create',
        limitValue: 50,
        description: '可创建场景数',
      },
      {
        vipTierId: proTier.id,
        resourceKey: 'project:create',
        limitValue: 20,
        description: '可创建项目数',
      },
      {
        vipTierId: proTier.id,
        resourceKey: 'storage:mb',
        limitValue: 1024,
        description: '存储空间(MB)',
      },
      // 企业版无限制
      {
        vipTierId: enterpriseTier.id,
        resourceKey: 'scene:create',
        limitValue: -1,
        description: '可创建场景数',
      },
      {
        vipTierId: enterpriseTier.id,
        resourceKey: 'project:create',
        limitValue: -1,
        description: '可创建项目数',
      },
      {
        vipTierId: enterpriseTier.id,
        resourceKey: 'storage:mb',
        limitValue: -1,
        description: '存储空间(MB)',
      },
    ]

    for (const limit of defaultLimits) {
      await VipResourceLimit.create(limit)
    }
    console.log(`✅ 已创建 ${defaultLimits.length} 个默认 VIP 资源限制`)
  },
}

export default vipResourceLimitSeed
