import { where, parse } from '@pkg/ssql'
import VipTier from '@/models/vip-tier'
import type { VipTierInsert, VipTierUpdate } from '@/models/vip-tier'
import VipResourceLimit from '@/models/vip-resource-limit'
import type { VipResourceLimitInsert, VipResourceLimitUpdate } from '@/models/vip-resource-limit'
import UserVip from '@/models/user-vip'
import type { UserVipInsert, UserVipUpdate } from '@/models/user-vip'
import UserResourceUsage from '@/models/user-resource-usage'
import User from '@/models/users'

/** VIP 绑定回调函数类型 */
export type VipBindingCallback = (params: {
  userId: number
  userVipId: number
  vipTierId: number
  roleId: number | null
  originalRoleId: number | null
  action: 'bind' | 'unbind' | 'confirm' | 'cancel'
}) => Promise<void>

/** VIP 服务 */
export class VipService {
  /** VIP 绑定回调 */
  private bindingCallback: VipBindingCallback | null = null

  /** 设置绑定回调 */
  setBindingCallback(callback: VipBindingCallback) {
    this.bindingCallback = callback
  }

  // ============ VIP 等级管理 ============

  /** 获取所有 VIP 等级 */
  async findAllTiers(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // 解析 ssql 过滤条件
    const whereClause = query?.filter ? where().expr(parse(query.filter)) : where()

    const data = await VipTier.findMany({
      where: whereClause,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'id', order: 'asc' }],
    })

    const total = await VipTier.count(whereClause)

    return { data, total, page, pageSize }
  }

  /** 根据 ID 获取 VIP 等级 */
  async findTierById(id: number) {
    return await VipTier.findOne({ where: where().eq('id', id) })
  }

  /** 根据代码获取 VIP 等级 */
  async findTierByCode(code: string) {
    return await VipTier.findOne({ where: where().eq('code', code) })
  }

  /** 创建 VIP 等级 */
  async createTier(data: VipTierInsert) {
    return await VipTier.create(data)
  }

  /** 更新 VIP 等级 */
  async updateTier(id: number, data: VipTierUpdate) {
    return await VipTier.update(id, data)
  }

  /** 删除 VIP 等级 */
  async deleteTier(id: number) {
    // 检查是否有用户使用该 VIP 等级
    const usersWithTier = await UserVip.findMany({ where: where().eq('vipTierId', id) })
    if (usersWithTier.length > 0) {
      throw new Error(`无法删除 VIP 等级：有 ${usersWithTier.length} 个用户正在使用`)
    }
    // 级联删除资源限制
    await VipResourceLimit.deleteMany(where().eq('vipTierId', id))
    return await VipTier.delete(id)
  }

  // ============ VIP 资源限制管理 ============

  /** 获取 VIP 等级的资源限制 */
  async findResourceLimitsByTierId(vipTierId: number) {
    return await VipResourceLimit.findMany({ where: where().eq('vipTierId', vipTierId) })
  }

  /** 根据 ID 获取资源限制 */
  async findResourceLimitById(id: number) {
    return await VipResourceLimit.findOne({ where: where().eq('id', id) })
  }

  /** 创建资源限制 */
  async createResourceLimit(data: VipResourceLimitInsert) {
    // 检查是否已存在相同的资源限制
    const existing = await VipResourceLimit.findOne({
      where: where().eq('vipTierId', data.vipTierId).eq('resourceKey', data.resourceKey),
    })
    if (existing) {
      throw new Error('该 VIP 等级已存在相同资源键的限制')
    }
    return await VipResourceLimit.create(data)
  }

  /** 更新资源限制 */
  async updateResourceLimit(id: number, data: VipResourceLimitUpdate) {
    return await VipResourceLimit.update(id, data)
  }

  /** 删除资源限制 */
  async deleteResourceLimit(id: number) {
    return await VipResourceLimit.delete(id)
  }

  // ============ 用户 VIP 管理 ============

  /** 获取所有用户 VIP 列表 */
  async findAllUserVips(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // 解析 ssql 过滤条件
    const whereClause = query?.filter ? where().expr(parse(query.filter)) : where()

    const data = await UserVip.findMany({
      where: whereClause,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'id', order: 'desc' }],
    })

    const total = await UserVip.count(whereClause)

    return { data, total, page, pageSize }
  }

  /** 获取用户的 VIP 信息 */
  async getUserVip(userId: number) {
    const userVip = await UserVip.findOne({
      where: where().eq('userId', userId).eq('status', 1),
    })

    if (!userVip) return null

    // 获取 VIP 等级信息
    const vipTier = await this.findTierById(userVip.vipTierId)
    // 获取资源限制
    const resourceLimits = await this.findResourceLimitsByTierId(userVip.vipTierId)

    return {
      ...userVip,
      vipTier,
      resourceLimits,
    }
  }

  /** 根据 ID 获取用户 VIP */
  async getUserVipById(id: number) {
    return await UserVip.findOne({ where: where().eq('id', id) })
  }

  /**
   * 升级用户 VIP
   * @param userId 用户 ID
   * @param vipTierCode VIP 等级代码
   * @param options 选项
   * @param options.expireTime 过期时间（可选，不传则根据 VIP 等级自动计算）
   * @returns 用户 VIP 记录
   */
  async upgradeUserVip(
    userId: number,
    vipTierCode: string,
    options?: { expireTime?: string | null },
  ) {
    const { expireTime } = options ?? {}

    // 获取 VIP 等级
    const vipTier = await this.findTierByCode(vipTierCode)
    if (!vipTier) {
      throw new Error('VIP 等级不存在')
    }
    if (vipTier.status !== 1) {
      throw new Error('VIP 等级已禁用')
    }

    // 获取用户信息
    const user = await User.findOne({ where: where().eq('id', userId) })
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查用户是否已有 VIP
    const existingVip = await UserVip.findOne({
      where: where().eq('userId', userId).eq('status', 1),
    })

    // 计算过期时间
    let calculatedExpireTime: Date | null = null
    if (expireTime) {
      calculatedExpireTime = new Date(expireTime)
    } else if (vipTier.durationDays > 0) {
      calculatedExpireTime = new Date()
      calculatedExpireTime.setDate(calculatedExpireTime.getDate() + vipTier.durationDays)
    }

    // 如果已有 VIP，先禁用旧的
    if (existingVip) {
      await UserVip.update(existingVip.id, { status: 0 })
    }

    // 创建新的用户 VIP 记录（待确认状态）
    const userVip = await UserVip.create({
      userId,
      vipTierId: vipTier.id,
      expireTime: calculatedExpireTime,
      status: 1,
      bindingStatus: 0, // 待确认
      originalRoleId: user.roleId, // 保存原角色 ID
    })

    // 触发绑定回调（预绑定）
    if (this.bindingCallback && vipTier.roleId) {
      await this.bindingCallback({
        userId,
        userVipId: userVip.id!,
        vipTierId: vipTier.id,
        roleId: vipTier.roleId,
        originalRoleId: user.roleId,
        action: 'bind',
      })
    }

    return userVip
  }

  /**
   * 直接升级用户 VIP（不需要确认，立即生效）
   * @param userId 用户 ID
   * @param vipTierCode VIP 等级代码
   * @param options 选项
   * @param options.expireTime 过期时间（可选，不传则根据 VIP 等级自动计算）
   * @returns 用户 VIP 记录
   */
  async upgradeUserVipDirect(
    userId: number,
    vipTierCode: string,
    options?: { expireTime?: string | null },
  ) {
    const { expireTime } = options ?? {}

    // 获取 VIP 等级
    const vipTier = await this.findTierByCode(vipTierCode)
    if (!vipTier) {
      throw new Error('VIP 等级不存在')
    }
    if (vipTier.status !== 1) {
      throw new Error('VIP 等级已禁用')
    }

    // 获取用户信息
    const user = await User.findOne({ where: where().eq('id', userId) })
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查用户是否已有 VIP
    const existingVip = await UserVip.findOne({
      where: where().eq('userId', userId).eq('status', 1),
    })

    // 计算过期时间
    let calculatedExpireTime: Date | null = null
    if (expireTime) {
      calculatedExpireTime = new Date(expireTime)
    } else if (vipTier.durationDays > 0) {
      calculatedExpireTime = new Date()
      calculatedExpireTime.setDate(calculatedExpireTime.getDate() + vipTier.durationDays)
    }

    // 如果已有 VIP，先禁用旧的
    if (existingVip) {
      await UserVip.update(existingVip.id, { status: 0 })
    }

    // 创建新的用户 VIP 记录（直接生效）
    const userVip = await UserVip.create({
      userId,
      vipTierId: vipTier.id,
      expireTime: calculatedExpireTime,
      status: 1,
      bindingStatus: 1, // 直接生效
      originalRoleId: user.roleId, // 保存原角色 ID
    })

    // 直接更新用户角色
    if (vipTier.roleId) {
      await User.update(userId, { roleId: vipTier.roleId })
    }

    // 触发确认回调
    if (this.bindingCallback && vipTier.roleId) {
      await this.bindingCallback({
        userId,
        userVipId: userVip.id!,
        vipTierId: vipTier.id,
        roleId: vipTier.roleId,
        originalRoleId: user.roleId,
        action: 'confirm',
      })
    }

    return userVip
  }

  /**
   * 确认 VIP 绑定
   * @param userVipId 用户 VIP ID
   * @param confirm 是否确认
   */
  async confirmVipBinding(userVipId: number, confirm: boolean) {
    const userVip = await this.getUserVipById(userVipId)
    if (!userVip) {
      throw new Error('用户 VIP 记录不存在')
    }
    if (userVip.bindingStatus === 1) {
      throw new Error('VIP 绑定已确认，无法重复操作')
    }

    const vipTier = await this.findTierById(userVip.vipTierId)

    if (confirm) {
      // 确认绑定
      await UserVip.update(userVipId, { bindingStatus: 1 })

      // 如果有绑定角色，更新用户角色
      if (vipTier?.roleId) {
        await User.update(userVip.userId, { roleId: vipTier.roleId })
      }

      // 触发确认回调
      if (this.bindingCallback) {
        await this.bindingCallback({
          userId: userVip.userId,
          userVipId,
          vipTierId: userVip.vipTierId,
          roleId: vipTier?.roleId ?? null,
          originalRoleId: userVip.originalRoleId,
          action: 'confirm',
        })
      }
    } else {
      // 取消绑定，恢复原角色
      await UserVip.update(userVipId, { status: 0 })

      if (userVip.originalRoleId) {
        await User.update(userVip.userId, { roleId: userVip.originalRoleId })
      }

      // 触发取消回调
      if (this.bindingCallback) {
        await this.bindingCallback({
          userId: userVip.userId,
          userVipId,
          vipTierId: userVip.vipTierId,
          roleId: vipTier?.roleId ?? null,
          originalRoleId: userVip.originalRoleId,
          action: 'cancel',
        })
      }
    }

    return await this.getUserVipById(userVipId)
  }

  /**
   * 取消用户 VIP
   * @param userId 用户 ID
   */
  async cancelUserVip(userId: number) {
    const userVip = await UserVip.findOne({
      where: where().eq('userId', userId).eq('status', 1),
    })

    if (!userVip) {
      throw new Error('用户没有有效的 VIP')
    }

    const vipTier = await this.findTierById(userVip.vipTierId)

    // 禁用 VIP
    await UserVip.update(userVip.id, { status: 0 })

    // 恢复原角色
    if (userVip.originalRoleId) {
      await User.update(userId, { roleId: userVip.originalRoleId })
    }

    // 触发解绑回调
    if (this.bindingCallback) {
      await this.bindingCallback({
        userId,
        userVipId: userVip.id,
        vipTierId: userVip.vipTierId,
        roleId: vipTier?.roleId ?? null,
        originalRoleId: userVip.originalRoleId,
        action: 'unbind',
      })
    }

    return userVip
  }

  // ============ 用户资源使用管理 ============

  /**
   * 检查用户是否可以使用某资源
   * @param userId 用户 ID
   * @param resourceKey 资源键
   * @param amount 需要使用的数量（默认 1）
   */
  async checkResourceUsage(userId: number, resourceKey: string, amount: number = 1) {
    // 获取用户 VIP
    const userVip = await this.getUserVip(userId)
    if (!userVip || userVip.bindingStatus !== 1) {
      // 没有确认的 VIP，默认无法使用
      return {
        resourceKey,
        currentUsage: 0,
        limitValue: 0,
        available: 0,
        canUse: false,
      }
    }

    // 获取资源限制
    const resourceLimit = userVip.resourceLimits?.find((r) => r.resourceKey === resourceKey)
    const limitValue = resourceLimit?.limitValue ?? 0

    // -1 表示无限制
    if (limitValue === -1) {
      return {
        resourceKey,
        currentUsage: 0,
        limitValue: -1,
        available: -1,
        canUse: true,
      }
    }

    // 获取当前使用量
    const usage = await UserResourceUsage.findOne({
      where: where().eq('userId', userId).eq('resourceKey', resourceKey),
    })
    const currentUsage = usage?.usageCount ?? 0
    const available = limitValue - currentUsage

    return {
      resourceKey,
      currentUsage,
      limitValue,
      available,
      canUse: available >= amount,
    }
  }

  /**
   * 增加用户资源使用量
   * @param userId 用户 ID
   * @param resourceKey 资源键
   * @param amount 增加数量（默认 1）
   */
  async incrementResourceUsage(userId: number, resourceKey: string, amount: number = 1) {
    // 先检查是否可以使用
    const checkResult = await this.checkResourceUsage(userId, resourceKey, amount)
    if (!checkResult.canUse) {
      throw new Error(`资源 ${resourceKey} 已达到使用上限`)
    }

    // 获取或创建使用记录
    let usage = await UserResourceUsage.findOne({
      where: where().eq('userId', userId).eq('resourceKey', resourceKey),
    })

    if (usage) {
      await UserResourceUsage.update(usage.id, {
        usageCount: usage.usageCount + amount,
      })
    } else {
      await UserResourceUsage.create({
        userId,
        resourceKey,
        usageCount: amount,
      })
    }

    return await this.checkResourceUsage(userId, resourceKey)
  }

  /**
   * 减少用户资源使用量
   * @param userId 用户 ID
   * @param resourceKey 资源键
   * @param amount 减少数量（默认 1）
   */
  async decrementResourceUsage(userId: number, resourceKey: string, amount: number = 1) {
    const usage = await UserResourceUsage.findOne({
      where: where().eq('userId', userId).eq('resourceKey', resourceKey),
    })

    if (usage && usage.usageCount > 0) {
      const newCount = Math.max(0, usage.usageCount - amount)
      await UserResourceUsage.update(usage.id, { usageCount: newCount })
    }

    return await this.checkResourceUsage(userId, resourceKey)
  }

  /**
   * 获取用户所有资源使用情况
   * @param userId 用户 ID
   */
  async getUserResourceUsages(userId: number) {
    const userVip = await this.getUserVip(userId)
    if (!userVip) return []

    const usages = await UserResourceUsage.findMany({
      where: where().eq('userId', userId),
    })

    // 组合资源限制和使用情况
    return (userVip.resourceLimits ?? []).map((limit) => {
      const usage = usages.find((u) => u.resourceKey === limit.resourceKey)
      const currentUsage = usage?.usageCount ?? 0
      const available = limit.limitValue === -1 ? -1 : limit.limitValue - currentUsage

      return {
        resourceKey: limit.resourceKey,
        description: limit.description,
        currentUsage,
        limitValue: limit.limitValue,
        available,
        canUse: limit.limitValue === -1 || available > 0,
      }
    })
  }
}

/** VIP 服务单例 */
export const vipService = new VipService()
