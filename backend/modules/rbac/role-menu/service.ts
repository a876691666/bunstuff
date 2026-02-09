import type { Insert } from '@/packages/orm'
import RoleMenu from '@/models/role-menu'
import { CrudService, type CrudContext } from '@/modules/crud-service'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 角色菜单关联服务 */
export class RoleMenuService extends CrudService<typeof RoleMenu.schema> {
  constructor() {
    super(RoleMenu)
  }

  /** 根据角色ID获取菜单ID列表 */
  async findMenuIdsByRoleId(roleId: number) {
    const records = await this.model.findMany({ where: `roleId = ${roleId}` })
    return records.map((r) => r.menuId)
  }

  /** 创建角色菜单关联 */
  override async create(data: Insert<typeof RoleMenu>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 删除角色菜单关联 */
  override async delete(id: number, ctx?: CrudContext) {
    const ok = await super.delete(id, ctx)
    if (ok) await rbacCache.reload()
    return ok
  }

  /** 根据角色ID删除所有关联 */
  async deleteByRoleId(roleId: number) {
    const result = await this.model.deleteMany(`roleId = ${roleId}`)
    await rbacCache.reload()
    return result
  }

  /** 批量设置角色菜单 */
  async batchSetRoleMenus(roleId: number, menuIds: number[], ctx?: CrudContext) {
    await this.deleteByRoleId(roleId)
    const results = []
    for (const menuId of menuIds) {
      const result = await this.create({ roleId, menuId }, ctx)
      results.push(result)
    }
    return results
  }
}

export const roleMenuService = new RoleMenuService()
