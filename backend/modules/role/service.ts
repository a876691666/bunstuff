import { where } from "@pkg/ssql";
import Role from "../../models/role";
import type { RoleInsert, RoleUpdate } from "../../models/role";
import RolePermission from "../../models/role-permission";
import RoleMenu from "../../models/role-menu";
import User from "../../models/users";
import { rbacCache } from "../rbac/cache";

/** 角色服务 */
export class RoleService {
  /** 获取所有角色 */
  async findAll(query?: {
    page?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    status?: number;
  }) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    // TODO: 添加过滤条件
    const data = await Role.findMany({
      limit: pageSize,
      offset,
    });

    const total = await Role.count();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /** 根据ID获取角色 */
  async findById(id: number) {
    return await Role.findOne({ where: where().eq("id", id) });
  }

  /** 根据编码获取角色 */
  async findByCode(code: string) {
    return await Role.findOne({ where: where().eq("code", code) });
  }

  /** 创建角色 */
  async create(data: RoleInsert) {
    const result = await Role.create(data);
    await rbacCache.reload();
    return result;
  }

  /** 更新角色 */
  async update(id: number, data: RoleUpdate) {
    const result = await Role.update(id, data);
    await rbacCache.reload();
    return result;
  }

  /** 删除角色 */
  async delete(id: number) {
    // 检查是否有用户使用该角色
    const usersWithRole = await User.findMany({ where: where().eq("roleId", id) });
    if (usersWithRole.length > 0) {
      throw new Error(`无法删除角色：有 ${usersWithRole.length} 个用户正在使用该角色`);
    }

    // 检查是否有子角色
    const childRoles = await Role.findMany({ where: where().eq("parentId", id) });
    if (childRoles.length > 0) {
      throw new Error(`无法删除角色：存在 ${childRoles.length} 个子角色`);
    }

    // 级联删除角色权限关联
    await RolePermission.deleteMany(where().eq("roleId", id));

    // 级联删除角色菜单关联
    await RoleMenu.deleteMany(where().eq("roleId", id));

    // 删除角色
    const result = await Role.delete(id);
    await rbacCache.reload();
    return result;
  }

  /** 获取角色树 */
  async getTree() {
    const roles = await Role.findMany({
      orderBy: [{ column: "sort", order: "ASC" }],
    });
    return this.buildTree(roles);
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

export const roleService = new RoleService();
