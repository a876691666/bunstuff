
import type { Insert, Update } from '@/packages/orm'
import Permission from '@/models/permission'
import RolePermission from '@/models/role-permission'
import PermissionScope from '@/models/permission-scope'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 权限服务 */
export class PermissionService {
  /** 获取所有权限 */
  async findAll(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    const data = await Permission.findMany({
      where: query?.filter,
      limit: pageSize,
      offset,
    })

    const total = await Permission.count(query?.filter)

    return {
      data,
      total,
      page,
      pageSize,
    }
  }

  /** 根据ID获取权限 */
  async findById(id: number) {
    return await Permission.findOne({ where: `id = ${id}` })
  }

  /** 根据编码获取权限 */
  async findByCode(code: string) {
    return await Permission.findOne({ where: `code = '${code}'` })
  }

  /** 创建权限 */
  async create(data: Insert<typeof Permission>) {
    const result = await Permission.create(data)
    await rbacCache.reload()
    return result
  }

  /** 更新权限 */
  async update(id: number, data: Update<typeof Permission>) {
    const result = await Permission.update(id, data)
    await rbacCache.reload()
    return result
  }

  /** 删除权限 */
  async delete(id: number) {
    // 级联删除角色权限关联
    await RolePermission.deleteMany(`permissionId = ${id}`)

    // 级联删除数据过滤规则
    await PermissionScope.deleteMany(`permissionId = ${id}`)

    // 删除权限
    const result = await Permission.delete(id)
    await rbacCache.reload()
    return result
  }
}

export const permissionService = new PermissionService()
