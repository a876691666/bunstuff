/**
 * 角色菜单关联服务
 * 从 modules/rbac/role-menu/service.ts 迁移
 */

import type { Insert } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const RoleMenu = model.role_menu
import { reload } from '@/services/rbac-cache'

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return RoleMenu.page({
    where: buildWhere(RoleMenu.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return RoleMenu.findOne({ where: buildWhere(RoleMenu.tableName, `id = ${id}`, ctx) })
}

export async function findMenuIdsByRoleId(roleId: number) {
  const records = await RoleMenu.findMany({ where: `roleId = ${roleId}` })
  return records.map((r) => r.menuId)
}

export async function create(data: Insert<typeof RoleMenu>, ctx?: CrudContext) {
  if (!checkCreateScope(RoleMenu.tableName, data as Record<string, any>, ctx)) return null
  const result = await RoleMenu.create(data)
  if (result) await reload()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(RoleMenu.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await RoleMenu.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

export async function deleteByRoleId(roleId: number) {
  const result = await RoleMenu.deleteMany(`roleId = ${roleId}`)
  await reload()
  return result
}

export async function batchSetRoleMenus(roleId: number, menuIds: number[], ctx?: CrudContext) {
  await deleteByRoleId(roleId)
  const results = []
  for (const menuId of menuIds) {
    const result = await create({ roleId, menuId }, ctx)
    results.push(result)
  }
  return results
}

/** Schema 代理 */
export const getSchema: (typeof RoleMenu)['getSchema'] = RoleMenu.getSchema.bind(RoleMenu)
