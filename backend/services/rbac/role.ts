import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { reload } from './cache'

const Role = model.role
const User = model.users

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return Role.page({
    where: buildWhere(Role.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: string, ctx?: CrudContext) {
  return Role.findOne({ where: buildWhere(Role.tableName, `id = '${id}'`, ctx) })
}

export async function create(data: Insert<typeof Role>, ctx?: CrudContext) {
  if (!checkCreateScope(Role.tableName, data as Record<string, any>, ctx)) return null
  const result = await Role.create(data)
  if (result) await reload()
  return result
}

export async function update(id: string, data: Update<typeof Role>, ctx?: CrudContext) {
  const w = buildWhere(Role.tableName, `id = '${id}'`, ctx)
  if (!w) return null
  const n = await Role.updateMany(w, data)
  if (n === 0) return null
  const result = await Role.getOne(id as any)
  if (result) await reload()
  return result
}

export async function remove(id: string, ctx?: CrudContext) {
  const usersWithRole = await User.findMany({ where: `roleId = '${id}'` })
  if (usersWithRole.length > 0) {
    throw new Error(`无法删除角色：有 ${usersWithRole.length} 个用户正在使用该角色`)
  }
  const w = buildWhere(Role.tableName, `id = '${id}'`, ctx)
  if (!w) return false
  const ok = (await Role.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

/** Schema 代理 */


/** 获取角色列表（扁平，无树结构） */
export async function getTree() {
  const roles = await Role.findMany({ orderBy: [{ column: 'sort', order: 'ASC' }] })
  return roles.map((r) => ({ ...r, children: [] }))
}
