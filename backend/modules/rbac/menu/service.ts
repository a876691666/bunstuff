import type { Insert, Update } from '@/packages/orm'
import Menu from '@/models/menu'
import RoleMenu from '@/models/role-menu'
import { CrudService, type CrudContext } from '@/modules/crud-service'
import { rbacCache } from '@/modules/rbac/main/cache'

/** 菜单服务 */
export class MenuService extends CrudService<typeof Menu.schema> {
  constructor() {
    super(Menu)
  }

  /** 创建菜单 */
  override async create(data: Insert<typeof Menu>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 更新菜单 */
  override async update(id: number, data: Update<typeof Menu>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await rbacCache.reload()
    return result
  }

  /** 删除菜单 */
  override async delete(id: number, ctx?: CrudContext) {
    // 检查是否有子菜单
    const childMenus = await this.model.findMany({ where: `parentId = ${id}` })
    if (childMenus.length > 0) {
      throw new Error(`无法删除菜单：存在 ${childMenus.length} 个子菜单`)
    }
    // 级联删除角色菜单关联
    await RoleMenu.deleteMany(`menuId = ${id}`)
    const ok = await super.delete(id, ctx)
    if (ok) await rbacCache.reload()
    return ok
  }

  /** 获取菜单树 */
  async getTree() {
    const menus = await this.model.findMany({
      orderBy: [{ column: 'sort', order: 'ASC' }],
    })
    return this.buildTree(menus)
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

export const menuService = new MenuService()
