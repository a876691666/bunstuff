import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { rateLimitCache } from './cache'

const RateLimitRule = model.rate_limit_rule

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return RateLimitRule.page({
    where: buildWhere(RateLimitRule.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return RateLimitRule.findOne({ where: buildWhere(RateLimitRule.tableName, `id = ${id}`, ctx) })
}

export async function findByCode(code: string) {
  return RateLimitRule.findOne({ where: `code = '${code}'` })
}

export async function create(data: Insert<typeof RateLimitRule>, ctx?: CrudContext) {
  if (!checkCreateScope(RateLimitRule.tableName, data as Record<string, any>, ctx)) return null
  const result = await RateLimitRule.create(data)
  if (result) await rateLimitCache.reloadRules()
  return result
}

export async function update(id: number, data: Update<typeof RateLimitRule>, ctx?: CrudContext) {
  const w = buildWhere(RateLimitRule.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await RateLimitRule.updateMany(w, data)
  if (n === 0) return null
  const result = await RateLimitRule.getOne(id as any)
  if (result) await rateLimitCache.reloadRules()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(RateLimitRule.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await RateLimitRule.deleteMany(w)) > 0
  if (ok) await rateLimitCache.reloadRules()
  return ok
}

/** Schema 代理 */

