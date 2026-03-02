/**
 * 权限服务
 * 从 modules/rbac/permission/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { reload } from '@/services/rbac-cache'

const Permission = model.permission
const RolePermission = model.role_permission
const PermissionScope = model.permission_scope

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return Permission.page({
    where: buildWhere(Permission.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return Permission.findOne({ where: buildWhere(Permission.tableName, `id = ${id}`, ctx) })
}

export async function findByCode(code: string) {
  return Permission.findOne({ where: `code = '${code}'` })
}

export async function create(data: Insert<typeof Permission>, ctx?: CrudContext) {
  if (!checkCreateScope(Permission.tableName, data as Record<string, any>, ctx)) return null
  const result = await Permission.create(data)
  if (result) await reload()
  return result
}

export async function update(id: number, data: Update<typeof Permission>, ctx?: CrudContext) {
  const w = buildWhere(Permission.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await Permission.updateMany(w, data)
  if (n === 0) return null
  const result = await Permission.getOne(id as any)
  if (result) await reload()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  await RolePermission.deleteMany(`permissionId = ${id}`)
  await PermissionScope.deleteMany(`permissionId = ${id}`)
  const w = buildWhere(Permission.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await Permission.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

/** Schema 代理 */
export const getSchema: (typeof Permission)['getSchema'] = Permission.getSchema.bind(Permission)
