/**
 * 菜单服务
 * 从 modules/rbac/menu/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { reload } from '@/services/rbac-cache'

const Menu = model.menu

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return Menu.page({
    where: buildWhere(Menu.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return Menu.findOne({ where: buildWhere(Menu.tableName, `id = ${id}`, ctx) })
}

export async function create(data: Insert<typeof Menu>, ctx?: CrudContext) {
  if (!checkCreateScope(Menu.tableName, data as Record<string, any>, ctx)) return null
  const result = await Menu.create(data)
  if (result) await reload()
  return result
}

export async function update(id: number, data: Update<typeof Menu>, ctx?: CrudContext) {
  const w = buildWhere(Menu.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await Menu.updateMany(w, data)
  if (n === 0) return null
  const result = await Menu.getOne(id as any)
  if (result) await reload()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const childMenus = await Menu.findMany({ where: `parentId = ${id}` })
  if (childMenus.length > 0) {
    throw new Error(`无法删除菜单：存在 ${childMenus.length} 个子菜单`)
  }
  const w = buildWhere(Menu.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await Menu.deleteMany(w)) > 0
  if (ok) await reload()
  return ok
}

export async function getTree() {
  const menus = await Menu.findMany({
    orderBy: [{ column: 'sort', order: 'ASC' }],
  })
  return buildTree(menus)
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
export const getSchema: (typeof Menu)['getSchema'] = Menu.getSchema.bind(Menu)
