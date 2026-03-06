import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import type { Insert, Update } from '@/packages/orm'

const User = model.users

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return User.page({
    where: buildWhere(User.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return User.findOne({ where: buildWhere(User.tableName, `id = ${id}`, ctx) })
}

export async function findByUsername(username: string) {
  return User.findOne({ where: `username = '${username}'` })
}

export async function create(data: Insert<typeof User>, ctx?: CrudContext) {
  if (!checkCreateScope(User.tableName, data as Record<string, any>, ctx)) return null
  return User.create(data)
}

export async function update(id: number, data: Update<typeof User>, ctx?: CrudContext) {
  const where = buildWhere(User.tableName, `id = ${id}`, ctx)
  if (!where) return null
  const n = await User.updateMany(where, data)
  if (n === 0) return null
  return User.getOne(id as any)
}

export async function remove(id: number, ctx?: CrudContext) {
  const where = buildWhere(User.tableName, `id = ${id}`, ctx)
  if (!where) return false
  return (await User.deleteMany(where)) > 0
}

/** Schema 代理 */
