/**
 * 参数配置服务
 * 从 modules/system/config/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const SysConfig = model.sys_config

// ============ 配置缓存 ============

const cache = new Map<string, any>()
let initialized = false

async function reloadCache() {
  cache.clear()
  const allConfigs = await SysConfig.findMany()
  for (const config of allConfigs) {
    cache.set(config.key, config)
  }
}

export async function initCache() {
  if (initialized) return
  await reloadCache()
  initialized = true
}

// ============ 缓存查询（供插件使用） ============

export function getConfigValue(key: string): string | null {
  return cache.get(key)?.value || null
}

export function getConfigValueOrDefault(key: string, defaultValue: string): string {
  return cache.get(key)?.value || defaultValue
}

export function getConfig(key: string): any | null {
  return cache.get(key) || null
}

// ============ CRUD ============

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return SysConfig.page({
    where: buildWhere(SysConfig.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return SysConfig.findOne({ where: buildWhere(SysConfig.tableName, `id = ${id}`, ctx) })
}

export async function findByKey(key: string) {
  return SysConfig.findOne({ where: `key = '${key}'` })
}

export async function create(data: Insert<typeof SysConfig>, ctx?: CrudContext) {
  if (!checkCreateScope(SysConfig.tableName, data as Record<string, any>, ctx)) return null
  const result = await SysConfig.create(data)
  if (result) await reloadCache()
  return result
}

export async function update(id: number, data: Update<typeof SysConfig>, ctx?: CrudContext) {
  const w = buildWhere(SysConfig.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await SysConfig.updateMany(w, data)
  if (n === 0) return null
  const result = await SysConfig.getOne(id as any)
  if (result) await reloadCache()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(SysConfig.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await SysConfig.deleteMany(w)) > 0
  if (ok) await reloadCache()
  return ok
}

/** Schema 代理 */
export const getSchema: (typeof SysConfig)['getSchema'] = SysConfig.getSchema.bind(SysConfig)
