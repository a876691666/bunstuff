import type { Insert, Update } from '@/packages/orm'
import Permission from '@/models/permission'
import RolePermission from '@/models/role-permission'
import PermissionScope from '@/models/permission-scope'
import { CrudService, type CrudContext } from '@/modules/crud-service'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 权限服务 */
export class PermissionService extends CrudService<typeof Permission.schema> {
  constructor() {
    super(Permission)
  }

  /** 根据编码获取权限 */
  async findByCode(code: string) {
    return await this.model.findOne({ where: `code = '${code}'` })
  }

  /** 创建权限 */
  override async create(data: Insert<typeof Permission>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 更新权限 */
  override async update(id: number, data: Update<typeof Permission>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 删除权限 */
  override async delete(id: number, ctx?: CrudContext) {
    // 级联删除角色权限关联
    await RolePermission.deleteMany(`permissionId = ${id}`)
    // 级联删除数据过滤规则
    await PermissionScope.deleteMany(`permissionId = ${id}`)
    const ok = await super.delete(id, ctx)
    if (ok) await rbacCache.reload()
    return ok
  }
}

export const permissionService = new PermissionService()
