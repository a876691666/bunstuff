/**
 * 角色服务
 * 从 modules/rbac/role/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { reload } from '@/services/rbac-cache'

const Role = model.role
const RolePermission = model.role_permission
const RoleMenu = model.role_menu
const User = model.users

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return Role.page({
    where: buildWhere(Role.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return Role.findOne({ where: buildWhere(Role.tableName, `id = ${id}`, ctx) })
}

export async function findByCode(code: string) {
  return Role.findOne({ where: `code = '${code}'` })
}

export async function create(data: Insert<typeof Role>, ctx?: CrudContext) {
  if (!checkCreateScope(Role.tableName, data as Record<string, any>, ctx)) return null
  const result = await Role.create(data)
  if (result) await reload()
  return result
}

export async function update(id: number, data: Update<typeof Role>, ctx?: CrudContext) {
  const w = buildWhere(Role.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await Role.updateMany(w, data)
  if (n === 0) return null
  const result = await Role.getOne(id as any)
  if (result) await reload()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const usersWithRole = await User.findMany({ where: `roleId = ${id}` })
  if (usersWithRole.length > 0) {
    throw new Error(`无法删除角色：有 ${usersWithRole.length} 个用户正在使用该角色`)
  }
  const childRoles = await Role.findMany({ where: `parentId = ${id}` })
  if (childRoles.length > 0) {
    throw new Error(`无法删除角色：存在 ${childRoles.length} 个子角色`)
  }
  await RolePermission.deleteMany(`roleId = ${id}`)
  await RoleMenu.deleteMany(`roleId = ${id}`)
  const w = buildWhere(Role.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await Role.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

export async function getTree() {
  const roles = await Role.findMany({
    orderBy: [{ column: 'sort', order: 'ASC' }],
  })
  return buildTree(roles)
}

function buildTree(items: any[], parentId: number | null = null): any[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }))
}

/** Schema 代理 */
export const getSchema: (typeof Role)['getSchema'] = Role.getSchema.bind(Role)
