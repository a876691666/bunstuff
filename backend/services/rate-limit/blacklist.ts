import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { rateLimitCache } from './cache'

const IpBlacklist = model.ip_blacklist

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return IpBlacklist.page({
    where: buildWhere(IpBlacklist.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return IpBlacklist.findOne({ where: buildWhere(IpBlacklist.tableName, `id = ${id}`, ctx) })
}

export async function findByIp(ip: string) {
  return IpBlacklist.findOne({ where: `ip = '${ip}' && status = 1` })
}

export async function create(data: Insert<typeof IpBlacklist>, ctx?: CrudContext) {
  if (!checkCreateScope(IpBlacklist.tableName, data as Record<string, any>, ctx)) return null
  const result = await IpBlacklist.create(data)
  if (result) await rateLimitCache.reloadBlacklist()
  return result
}

export async function update(
  id: number,
  data: Update<typeof IpBlacklist>,
  ctx?: CrudContext,
) {
  const w = buildWhere(IpBlacklist.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await IpBlacklist.updateMany(w, data)
  if (n === 0) return null
  const result = await IpBlacklist.getOne(id as any)
  if (result) await rateLimitCache.reloadBlacklist()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(IpBlacklist.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await IpBlacklist.deleteMany(w)) > 0
  if (ok) await rateLimitCache.reloadBlacklist()
  return ok
}

export async function unblock(id: number) {
  const item = await IpBlacklist.findOne({ where: `id = ${id}` })
  if (!item) return null
  const result = await IpBlacklist.update(id, { status: 0 })
  rateLimitCache.removeFromBlacklist(item.ip)
  return result
}

export async function autoBlock(ip: string, ruleId: number, triggerCount: number, reason: string) {
  const existing = await findByIp(ip)
  if (existing) {
    await IpBlacklist.update(existing.id, { triggerCount })
    return existing
  }
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const result = await IpBlacklist.create({
    ip,
    reason,
    source: 'auto',
    ruleId,
    triggerCount,
    expireAt,
    status: 1,
  })
  rateLimitCache.addToBlacklist(ip, expireAt)
  return result
}

/** Schema 代理 */
export const getSchema: (typeof IpBlacklist)['getSchema'] =
  IpBlacklist.getSchema.bind(IpBlacklist)
