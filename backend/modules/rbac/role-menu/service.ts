import { where } from "@pkg/ssql";
import RoleMenu from "@/models/role-menu";
import type { RoleMenuInsert } from "@/models/role-menu";
import { rbacCache } from "@/modules/rbac/main/cache";

/** 角色菜单关联服务 */
export class RoleMenuService {
  /** 获取所有角色菜单关联 */
  async findAll(query?: { page?: number; pageSize?: number; roleId?: number; menuId?: number }) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    // TODO: 添加过滤条件
    const data = await RoleMenu.findMany({
      limit: pageSize,
      offset,
    });

    const total = await RoleMenu.count();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /** 根据ID获取角色菜单关联 */
  async findById(id: number) {
    return await RoleMenu.findOne({ where: where().eq("id", id) });
  }

  /** 根据角色ID获取菜单ID列表 */
  async findMenuIdsByRoleId(roleId: number) {
    const records = await RoleMenu.findMany({ where: where().eq("roleId", roleId) });
    return records.map((r) => r.menuId);
  }

  /** 创建角色菜单关联 */
  async create(data: RoleMenuInsert) {
    const result = await RoleMenu.create(data);
    await rbacCache.reload();
    return result;
  }

  /** 删除角色菜单关联 */
  async delete(id: number) {
    const result = await RoleMenu.delete(id);
    await rbacCache.reload();
    return result;
  }

  /** 根据角色ID删除所有关联 */
  async deleteByRoleId(roleId: number) {
    const result = await RoleMenu.deleteMany(where().eq("roleId", roleId));
    await rbacCache.reload();
    return result;
  }

  /** 批量设置角色菜单 */
  async batchSetRoleMenus(roleId: number, menuIds: number[]) {
    // 先删除该角色的所有菜单关联
    await this.deleteByRoleId(roleId);

    // 批量创建新的关联
    const results = [];
    for (const menuId of menuIds) {
      const result = await this.create({ roleId, menuId });
      results.push(result);
    }

    return results;
  }
}

export const roleMenuService = new RoleMenuService();
