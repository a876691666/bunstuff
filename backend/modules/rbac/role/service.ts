import type { Insert, Update } from '@/packages/orm'
import Role from '@/models/role'
import RolePermission from '@/models/role-permission'
import RoleMenu from '@/models/role-menu'
import User from '@/models/users'
import { CrudService, type CrudContext } from '@/modules/crud-service'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 角色服务 */
export class RoleService extends CrudService<typeof Role.schema> {
  constructor() {
    super(Role)
  }

  /** 根据编码获取角色 */
  async findByCode(code: string) {
    return await this.model.findOne({ where: `code = '${code}'` })
  }

  /** 创建角色 */
  override async create(data: Insert<typeof Role>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 更新角色 */
  override async update(id: number, data: Update<typeof Role>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 删除角色 */
  override async delete(id: number, ctx?: CrudContext) {
    // 检查是否有用户使用该角色
    const usersWithRole = await User.findMany({ where: `roleId = ${id}` })
    if (usersWithRole.length > 0) {
      throw new Error(`无法删除角色：有 ${usersWithRole.length} 个用户正在使用该角色`)
    }
    // 检查是否有子角色
    const childRoles = await this.model.findMany({ where: `parentId = ${id}` })
    if (childRoles.length > 0) {
      throw new Error(`无法删除角色：存在 ${childRoles.length} 个子角色`)
    }
    // 级联删除
    await RolePermission.deleteMany(`roleId = ${id}`)
    await RoleMenu.deleteMany(`roleId = ${id}`)
    const ok = await super.delete(id, ctx)
    if (ok) await rbacCache.reload()
    return ok
  }

  /** 获取角色树 */
  async getTree() {
    const roles = await this.model.findMany({
      orderBy: [{ column: 'sort', order: 'ASC' }],
    })
    return this.buildTree(roles)
  }

  /** 构建树形结构 */
  private buildTree(items: any[], parentId: number | null = null): any[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }))
  }
}

export const roleService = new RoleService()
