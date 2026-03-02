/**
 * 角色权限关联服务
 * 从 modules/rbac/role-permission/service.ts 迁移
 */

import type { Insert } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const RolePermission = model.role_permission
import { reload } from '@/services/rbac-cache'

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return RolePermission.page({
    where: buildWhere(RolePermission.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return RolePermission.findOne({ where: buildWhere(RolePermission.tableName, `id = ${id}`, ctx) })
}

export async function findPermissionIdsByRoleId(roleId: number) {
  const records = await RolePermission.findMany({ where: `roleId = ${roleId}` })
  return records.map((r) => r.permissionId)
}

export async function create(data: Insert<typeof RolePermission>, ctx?: CrudContext) {
  if (!checkCreateScope(RolePermission.tableName, data as Record<string, any>, ctx)) return null
  const result = await RolePermission.create(data)
  if (result) await reload()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(RolePermission.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await RolePermission.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

export async function deleteByRoleId(roleId: number) {
  const result = await RolePermission.deleteMany(`roleId = ${roleId}`)
  await reload()
  return result
}

export async function batchSetRolePermissions(
  roleId: number,
  permissionIds: number[],
  ctx?: CrudContext,
) {
  await deleteByRoleId(roleId)
  const results = []
  for (const permissionId of permissionIds) {
    const result = await create({ roleId, permissionId }, ctx)
    results.push(result)
  }
  return results
}

/** Schema 代理 */
export const getSchema: (typeof RolePermission)['getSchema'] =
  RolePermission.getSchema.bind(RolePermission)
