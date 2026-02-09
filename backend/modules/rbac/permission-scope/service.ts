import type { Insert, Update } from '@/packages/orm'
import PermissionScope from '@/models/permission-scope'
import { CrudService, type CrudContext } from '@/modules/crud-service'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 数据过滤规则服务 */
export class PermissionScopeService extends CrudService<typeof PermissionScope.schema> {
  constructor() {
    super(PermissionScope)
  }

  /** 根据权限ID获取数据过滤规则列表 */
  async findByPermissionId(permissionId: number) {
    return await this.model.findMany({ where: `permissionId = ${permissionId}` })
  }

  /** 创建数据过滤规则 */
  override async create(data: Insert<typeof PermissionScope>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 更新数据过滤规则 */
  override async update(id: number, data: Update<typeof PermissionScope>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 删除数据过滤规则 */
  override async delete(id: number, ctx?: CrudContext) {
    const ok = await super.delete(id, ctx)
    if (ok) await rbacCache.reload()
    return ok
  }
}

export const permissionScopeService = new PermissionScopeService()
