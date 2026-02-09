import type { Insert } from '@/packages/orm'
import RolePermission from '@/models/role-permission'
import { CrudService, type CrudContext } from '@/modules/crud-service'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 角色权限关联服务 */
export class RolePermissionService extends CrudService<typeof RolePermission.schema> {
  constructor() {
    super(RolePermission)
  }

  /** 根据角色ID获取权限ID列表 */
  async findPermissionIdsByRoleId(roleId: number) {
    const records = await this.model.findMany({ where: `roleId = ${roleId}` })
    return records.map((r) => r.permissionId)
  }

  /** 创建角色权限关联 */
  override async create(data: Insert<typeof RolePermission>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 删除角色权限关联 */
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

  /** 批量设置角色权限 */
  async batchSetRolePermissions(roleId: number, permissionIds: number[], ctx?: CrudContext) {
    await this.deleteByRoleId(roleId)
    const results = []
    for (const permissionId of permissionIds) {
      const result = await this.create({ roleId, permissionId }, ctx)
      results.push(result)
    }
    return results
  }
}

export const rolePermissionService = new RolePermissionService()
