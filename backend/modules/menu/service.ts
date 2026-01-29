import { where } from "@pkg/ssql";
import Menu from "../../models/menu";
import type { MenuInsert, MenuUpdate } from "../../models/menu";
import RoleMenu from "../../models/role-menu";
import { rbacCache } from "../rbac/cache";

/** 菜单服务 */
export class MenuService {
  /** 获取所有菜单 */
  async findAll(query?: {
    page?: number;
    pageSize?: number;
    name?: string;
    status?: number;
    type?: number;
  }) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    // TODO: 添加过滤条件
    const data = await Menu.findMany({
      limit: pageSize,
      offset,
    });

    const total = await Menu.count();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /** 根据ID获取菜单 */
  async findById(id: number) {
    return await Menu.findOne({ where: where().eq("id", id) });
  }

  /** 创建菜单 */
  async create(data: MenuInsert) {
    const result = await Menu.create(data);
    await rbacCache.reload();
    return result;
  }

  /** 更新菜单 */
  async update(id: number, data: MenuUpdate) {
    const result = await Menu.update(id, data);
    await rbacCache.reload();
    return result;
  }

  /** 删除菜单 */
  async delete(id: number) {
    // 检查是否有子菜单
    const childMenus = await Menu.findMany({ where: where().eq("parentId", id) });
    if (childMenus.length > 0) {
      throw new Error(`无法删除菜单：存在 ${childMenus.length} 个子菜单`);
    }

    // 级联删除角色菜单关联
    await RoleMenu.deleteMany(where().eq("menuId", id));

    // 删除菜单
    const result = await Menu.delete(id);
    await rbacCache.reload();
    return result;
  }

  /** 获取菜单树 */
  async getTree() {
    const menus = await Menu.findMany({
      orderBy: { sort: "ASC" },
    });
    return this.buildTree(menus);
  }

  /** 构建树形结构 */
  private buildTree(items: any[], parentId: number | null = null): any[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }
}

export const menuService = new MenuService();
