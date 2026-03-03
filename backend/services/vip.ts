/**
 * VIP 服务
 * 从 modules/vip/main/service.ts 迁移
 */

import type { Row, Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const VipTier = model.vip_tier
const VipResourceLimit = model.vip_resource_limit
const UserVip = model.user_vip
const UserResourceUsage = model.user_resource_usage
const User = model.users

// ============ VIP 绑定回调 ============

export type VipBindingCallback = (params: {
  userId: number
  userVipId: number
  vipTierId: number
  roleId: string | null
  originalRoleId: string | null
  action: 'bind' | 'unbind' | 'confirm' | 'cancel'
}) => Promise<void>

let bindingCallback: VipBindingCallback | null = null

export function setBindingCallback(callback: VipBindingCallback) {
  bindingCallback = callback
}

// ============ VIP 等级管理 ============

export async function findAllTiers(query?: PageQuery, ctx?: CrudContext) {
  return VipTier.page({
    where: buildWhere(VipTier.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
    orderBy: [{ column: 'id', order: 'asc' }],
  })
}

export async function findTierById(id: number, ctx?: CrudContext) {
  return VipTier.findOne({ where: buildWhere(VipTier.tableName, `id = ${id}`, ctx) })
}

export async function findTierByCode(code: string) {
  return VipTier.findOne({ where: `code = '${code}'` })
}

export async function createTier(data: Insert<typeof VipTier>, ctx?: CrudContext) {
  if (!checkCreateScope(VipTier.tableName, data as Record<string, any>, ctx)) return null
  return VipTier.create(data)
}

export async function updateTier(id: number, data: Update<typeof VipTier>, ctx?: CrudContext) {
  const w = buildWhere(VipTier.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await VipTier.updateMany(w, data)
  if (n === 0) return null
  return VipTier.getOne(id as any)
}

export async function deleteTier(id: number, ctx?: CrudContext) {
  const usersWithTier = await UserVip.findMany({ where: `vipTierId = ${id}` })
  if (usersWithTier.length > 0) {
    throw new Error(`无法删除 VIP 等级：有 ${usersWithTier.length} 个用户正在使用`)
  }
  await VipResourceLimit.deleteMany(`vipTierId = ${id}`)
  const w = buildWhere(VipTier.tableName, `id = ${id}`, ctx)
  if (!w) return false
  return (await VipTier.deleteMany(w)) > 0
}

// ============ VIP 资源限制管理 ============

export async function findResourceLimitsByTierId(vipTierId: number, ctx?: CrudContext) {
  const w = buildWhere(VipResourceLimit.tableName, `vipTierId = ${vipTierId}`, ctx)
  return VipResourceLimit.findMany({ where: w })
}

export async function findResourceLimitById(id: number, ctx?: CrudContext) {
  return VipResourceLimit.findOne({
    where: buildWhere(VipResourceLimit.tableName, `id = ${id}`, ctx),
  })
}

export async function createResourceLimit(
  data: Insert<typeof VipResourceLimit>,
  ctx?: CrudContext,
) {
  const existing = await VipResourceLimit.findOne({
    where: `vipTierId = ${data.vipTierId} && resourceKey = '${data.resourceKey}'`,
  })
  if (existing) {
    throw new Error('该 VIP 等级已存在相同资源键的限制')
  }
  if (!checkCreateScope(VipResourceLimit.tableName, data as Record<string, any>, ctx)) return null
  return VipResourceLimit.create(data)
}

export async function updateResourceLimit(
  id: number,
  data: Update<typeof VipResourceLimit>,
  ctx?: CrudContext,
) {
  const w = buildWhere(VipResourceLimit.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await VipResourceLimit.updateMany(w, data)
  if (n === 0) return null
  return VipResourceLimit.getOne(id as any)
}

export async function deleteResourceLimit(id: number, ctx?: CrudContext) {
  const w = buildWhere(VipResourceLimit.tableName, `id = ${id}`, ctx)
  if (!w) return false
  return (await VipResourceLimit.deleteMany(w)) > 0
}

// ============ 用户 VIP 管理 ============

export async function findAllUserVips(query?: PageQuery, ctx?: CrudContext) {
  return UserVip.page({
    where: buildWhere(UserVip.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
    orderBy: [{ column: 'id', order: 'desc' }],
  })
}

export async function getUserVip(
  userId: number,
  ctx?: CrudContext,
): Promise<
  | (Row<typeof UserVip> & {
      vipTier: Row<typeof VipTier> | null
      resourceLimits: Row<typeof VipResourceLimit>[]
    })
  | null
> {
  const userVip = await UserVip.findOne({
    where: `userId = ${userId} && status = 1`,
  })
  if (!userVip) return null

  const vipTier = await findTierById(userVip.vipTierId)
  const resourceLimits = await findResourceLimitsByTierId(userVip.vipTierId)

  return { ...userVip, vipTier, resourceLimits }
}

export async function getUserVipById(id: number, ctx?: CrudContext) {
  return UserVip.findOne({ where: buildWhere(UserVip.tableName, `id = ${id}`, ctx) })
}

export async function upgradeUserVip(
  userId: number,
  vipTierCode: string,
  options?: { expireTime?: string | null },
) {
  const { expireTime } = options ?? {}

  const vipTier = await findTierByCode(vipTierCode)
  if (!vipTier) throw new Error('VIP 等级不存在')
  if (vipTier.status !== 1) throw new Error('VIP 等级已禁用')

  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) throw new Error('用户不存在')

  const existingVip = await UserVip.findOne({ where: `userId = ${userId} && status = 1` })

  let calculatedExpireTime: Date | null = null
  if (expireTime) {
    calculatedExpireTime = new Date(expireTime)
  } else if (vipTier.durationDays > 0) {
    calculatedExpireTime = new Date()
    calculatedExpireTime.setDate(calculatedExpireTime.getDate() + vipTier.durationDays)
  }

  if (existingVip) {
    await UserVip.update(existingVip.id, { status: 0 })
  }

  const userVip = await UserVip.create({
    userId,
    vipTierId: vipTier.id,
    expireTime: calculatedExpireTime,
    status: 1,
    bindingStatus: 0,
    originalRoleId: user.roleId,
  })

  if (bindingCallback && vipTier.roleId) {
    await bindingCallback({
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

export async function upgradeUserVipDirect(
  userId: number,
  vipTierCode: string,
  options?: { expireTime?: string | null },
) {
  const { expireTime } = options ?? {}

  const vipTier = await findTierByCode(vipTierCode)
  if (!vipTier) throw new Error('VIP 等级不存在')
  if (vipTier.status !== 1) throw new Error('VIP 等级已禁用')

  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) throw new Error('用户不存在')

  const existingVip = await UserVip.findOne({ where: `userId = ${userId} && status = 1` })

  let calculatedExpireTime: Date | null = null
  if (expireTime) {
    calculatedExpireTime = new Date(expireTime)
  } else if (vipTier.durationDays > 0) {
    calculatedExpireTime = new Date()
    calculatedExpireTime.setDate(calculatedExpireTime.getDate() + vipTier.durationDays)
  }

  if (existingVip) {
    await UserVip.update(existingVip.id, { status: 0 })
  }

  const userVip = await UserVip.create({
    userId,
    vipTierId: vipTier.id,
    expireTime: calculatedExpireTime,
    status: 1,
    bindingStatus: 1,
    originalRoleId: user.roleId,
  })

  if (vipTier.roleId) {
    await User.update(userId, { roleId: vipTier.roleId })
  }

  if (bindingCallback && vipTier.roleId) {
    await bindingCallback({
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

export async function confirmVipBinding(userVipId: number, confirm: boolean) {
  const userVip = await getUserVipById(userVipId)
  if (!userVip) throw new Error('用户 VIP 记录不存在')
  if (userVip.bindingStatus === 1) throw new Error('VIP 绑定已确认，无法重复操作')

  const vipTier = await findTierById(userVip.vipTierId)

  if (confirm) {
    await UserVip.update(userVipId, { bindingStatus: 1 })
    if (vipTier?.roleId) {
      await User.update(userVip.userId, { roleId: vipTier.roleId })
    }
    if (bindingCallback) {
      await bindingCallback({
        userId: userVip.userId,
        userVipId,
        vipTierId: userVip.vipTierId,
        roleId: vipTier?.roleId ?? null,
        originalRoleId: userVip.originalRoleId,
        action: 'confirm',
      })
    }
  } else {
    await UserVip.update(userVipId, { status: 0 })
    if (userVip.originalRoleId) {
      await User.update(userVip.userId, { roleId: userVip.originalRoleId })
    }
    if (bindingCallback) {
      await bindingCallback({
        userId: userVip.userId,
        userVipId,
        vipTierId: userVip.vipTierId,
        roleId: vipTier?.roleId ?? null,
        originalRoleId: userVip.originalRoleId,
        action: 'cancel',
      })
    }
  }

  return await getUserVipById(userVipId)
}

export async function cancelUserVip(userId: number) {
  const userVip = await UserVip.findOne({ where: `userId = ${userId} && status = 1` })
  if (!userVip) throw new Error('用户没有有效的 VIP')

  const vipTier = await findTierById(userVip.vipTierId)

  await UserVip.update(userVip.id, { status: 0 })

  if (userVip.originalRoleId) {
    await User.update(userId, { roleId: userVip.originalRoleId })
  }

  if (bindingCallback) {
    await bindingCallback({
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

export async function checkResourceUsage(userId: number, resourceKey: string, amount: number = 1) {
  const userVip = await getUserVip(userId)
  if (!userVip || userVip.bindingStatus !== 1) {
    return { resourceKey, currentUsage: 0, limitValue: 0, available: 0, canUse: false }
  }

  const resourceLimit = userVip.resourceLimits?.find((r) => r.resourceKey === resourceKey)
  const limitValue = resourceLimit?.limitValue ?? 0

  if (limitValue === -1) {
    return { resourceKey, currentUsage: 0, limitValue: -1, available: -1, canUse: true }
  }

  const usage = await UserResourceUsage.findOne({
    where: `userId = ${userId} && resourceKey = '${resourceKey}'`,
  })
  const currentUsage = usage?.usageCount ?? 0
  const available = limitValue - currentUsage

  return { resourceKey, currentUsage, limitValue, available, canUse: available >= amount }
}

export async function incrementResourceUsage(
  userId: number,
  resourceKey: string,
  amount: number = 1,
) {
  const checkResult = await checkResourceUsage(userId, resourceKey, amount)
  if (!checkResult.canUse) {
    throw new Error(`资源 ${resourceKey} 已达到使用上限`)
  }

  let usage = await UserResourceUsage.findOne({
    where: `userId = ${userId} && resourceKey = '${resourceKey}'`,
  })

  if (usage) {
    await UserResourceUsage.update(usage.id, { usageCount: usage.usageCount + amount })
  } else {
    await UserResourceUsage.create({ userId, resourceKey, usageCount: amount })
  }

  return await checkResourceUsage(userId, resourceKey)
}

export async function decrementResourceUsage(
  userId: number,
  resourceKey: string,
  amount: number = 1,
) {
  const usage = await UserResourceUsage.findOne({
    where: `userId = ${userId} && resourceKey = '${resourceKey}'`,
  })

  if (usage && usage.usageCount > 0) {
    const newCount = Math.max(0, usage.usageCount - amount)
    await UserResourceUsage.update(usage.id, { usageCount: newCount })
  }

  return await checkResourceUsage(userId, resourceKey)
}

export async function getUserResourceUsages(userId: number) {
  const userVip = await getUserVip(userId)
  if (!userVip) return []

  const usages = await UserResourceUsage.findMany({ where: `userId = ${userId}` })

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

/** Schema 代理 */
export const getTierSchema: (typeof VipTier)['getSchema'] = VipTier.getSchema.bind(VipTier)
export const getResourceLimitSchema: (typeof VipResourceLimit)['getSchema'] =
  VipResourceLimit.getSchema.bind(VipResourceLimit)
export const getUserVipSchema: (typeof UserVip)['getSchema'] = UserVip.getSchema.bind(UserVip)
