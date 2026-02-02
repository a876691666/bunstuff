import { where } from '@pkg/ssql'
import PermissionScope from '@/models/permission-scope'
import type { PermissionScopeInsert, PermissionScopeUpdate } from '@/models/permission-scope'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 数据过滤规则服务 */
export class PermissionScopeService {
  /** 获取所有数据过滤规则 */
  async findAll(query?: {
    page?: number
    pageSize?: number
    permissionId?: number
    name?: string
    tableName?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // TODO: 添加过滤条件
    const data = await PermissionScope.findMany({
      limit: pageSize,
      offset,
    })

    const total = await PermissionScope.count()

    return {
      data,
      total,
      page,
      pageSize,
    }
  }

  /** 根据ID获取数据过滤规则 */
  async findById(id: number) {
    return await PermissionScope.findOne({ where: where().eq('id', id) })
  }

  /** 根据权限ID获取数据过滤规则列表 */
  async findByPermissionId(permissionId: number) {
    return await PermissionScope.findMany({ where: where().eq('permissionId', permissionId) })
  }

  /** 创建数据过滤规则 */
  async create(data: PermissionScopeInsert) {
    const result = await PermissionScope.create(data)
    await rbacCache.reload()
    return result
  }

  /** 更新数据过滤规则 */
  async update(id: number, data: PermissionScopeUpdate) {
    const result = await PermissionScope.update(id, data)
    await rbacCache.reload()
    return result
  }

  /** 删除数据过滤规则 */
  async delete(id: number) {
    const result = await PermissionScope.delete(id)
    await rbacCache.reload()
    return result
  }
}

export const permissionScopeService = new PermissionScopeService()
