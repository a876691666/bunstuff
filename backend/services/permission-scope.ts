/**
 * 数据过滤规则服务
 * 从 modules/rbac/permission-scope/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const PermissionScope = model.permission_scope
import { reload } from '@/services/rbac-cache'

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return PermissionScope.page({
    where: buildWhere(PermissionScope.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return PermissionScope.findOne({
    where: buildWhere(PermissionScope.tableName, `id = ${id}`, ctx),
  })
}

export async function findByPermissionId(permissionId: number) {
  return PermissionScope.findMany({ where: `permissionId = ${permissionId}` })
}

export async function create(data: Insert<typeof PermissionScope>, ctx?: CrudContext) {
  if (!checkCreateScope(PermissionScope.tableName, data as Record<string, any>, ctx)) return null
  const result = await PermissionScope.create(data)
  if (result) await reload()
  return result
}

export async function update(id: number, data: Update<typeof PermissionScope>, ctx?: CrudContext) {
  const w = buildWhere(PermissionScope.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await PermissionScope.updateMany(w, data)
  if (n === 0) return null
  const result = await PermissionScope.getOne(id as any)
  if (result) await reload()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(PermissionScope.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await PermissionScope.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

/** Schema 代理 */
export const getSchema: (typeof PermissionScope)['getSchema'] =
  PermissionScope.getSchema.bind(PermissionScope)
