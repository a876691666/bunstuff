/**
 * 字典服务
 * 从 modules/system/dict/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const DictType = model.dict_type
const DictData = model.dict_data

// ============ 字典缓存 ============

const cache = new Map<string, Map<string, any>>()
let initialized = false

async function reloadCache() {
  cache.clear()
  const allData = await DictData.findMany({ where: `status = 1` })
  for (const item of allData) {
    if (!cache.has(item.dictType)) {
      cache.set(item.dictType, new Map())
    }
    cache.get(item.dictType)!.set(item.value, item)
  }
}

export async function initCache() {
  if (initialized) return
  await reloadCache()
  initialized = true
}

// ============ 缓存查询（供插件使用） ============

export function getDictMap(dictType: string): Map<string, any> {
  return cache.get(dictType) || new Map()
}

export function getDictList(dictType: string): any[] {
  const map = cache.get(dictType)
  return map ? Array.from(map.values()).sort((a, b) => a.sort - b.sort) : []
}

export function getDictLabel(dictType: string, value: string): string | null {
  return cache.get(dictType)?.get(value)?.label || null
}

// ============ 字典类型 CRUD ============

export async function findAllTypes(query?: PageQuery, ctx?: CrudContext) {
  return DictType.page({
    where: buildWhere(DictType.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findTypeById(id: number, ctx?: CrudContext) {
  return DictType.findOne({ where: buildWhere(DictType.tableName, `id = ${id}`, ctx) })
}

export async function findTypeByType(type: string) {
  return DictType.findOne({ where: `type = '${type}'` })
}

export async function createType(data: Insert<typeof DictType>, ctx?: CrudContext) {
  if (!checkCreateScope(DictType.tableName, data as Record<string, any>, ctx)) return null
  return DictType.create(data)
}

export async function updateType(id: number, data: Update<typeof DictType>, ctx?: CrudContext) {
  const w = buildWhere(DictType.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await DictType.updateMany(w, data)
  if (n === 0) return null
  const result = await DictType.getOne(id as any)
  await reloadCache()
  return result
}

export async function deleteType(id: number, ctx?: CrudContext) {
  const type = await findTypeById(id, ctx)
  if (type) {
    await DictData.deleteMany(`dictType = '${type.type}'`)
  }
  const w = buildWhere(DictType.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await DictType.deleteMany(w)) > 0
  await reloadCache()
  return ok
}

// ============ 字典数据 CRUD ============

export async function findAllData(query?: PageQuery, ctx?: CrudContext) {
  return DictData.page({
    where: buildWhere(DictData.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findDataById(id: number, ctx?: CrudContext) {
  return DictData.findOne({ where: buildWhere(DictData.tableName, `id = ${id}`, ctx) })
}

export async function findDataByType(dictType: string) {
  return DictData.findMany({
    where: `dictType = '${dictType}' && status = 1`,
    orderBy: [{ column: 'sort', order: 'ASC' }],
  })
}

export async function createData(data: Insert<typeof DictData>, ctx?: CrudContext) {
  if (!checkCreateScope(DictData.tableName, data as Record<string, any>, ctx)) return null
  const result = await DictData.create(data)
  await reloadCache()
  return result
}

export async function updateData(id: number, data: Update<typeof DictData>, ctx?: CrudContext) {
  const w = buildWhere(DictData.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await DictData.updateMany(w, data)
  if (n === 0) return null
  const result = await DictData.getOne(id as any)
  await reloadCache()
  return result
}

export async function deleteData(id: number, ctx?: CrudContext) {
  const w = buildWhere(DictData.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await DictData.deleteMany(w)) > 0
  await reloadCache()
  return ok
}

/** Schema 代理 */
export const getTypeSchema: (typeof DictType)['getSchema'] = DictType.getSchema.bind(DictType)
export const getDataSchema: (typeof DictData)['getSchema'] = DictData.getSchema.bind(DictData)
