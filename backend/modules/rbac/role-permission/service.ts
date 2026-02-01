import { where } from "@pkg/ssql";
import RolePermission from "@/models/role-permission";
import type { RolePermissionInsert } from "@/models/role-permission";
import { rbacCache } from "@/modules/rbac/main/cache";

/** 角色权限关联服务 */
export class RolePermissionService {
  /** 获取所有角色权限关联 */
  async findAll(query?: {
    page?: number;
    pageSize?: number;
    roleId?: number;
    permissionId?: number;
  }) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    // TODO: 添加过滤条件
    const data = await RolePermission.findMany({
      limit: pageSize,
      offset,
    });

    const total = await RolePermission.count();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /** 根据ID获取角色权限关联 */
  async findById(id: number) {
    return await RolePermission.findOne({ where: where().eq("id", id) });
  }

  /** 根据角色ID获取权限ID列表 */
  async findPermissionIdsByRoleId(roleId: number) {
    const records = await RolePermission.findMany({ where: where().eq("roleId", roleId) });
    return records.map((r) => r.permissionId);
  }

  /** 创建角色权限关联 */
  async create(data: RolePermissionInsert) {
    const result = await RolePermission.create(data);
    await rbacCache.reload();
    return result;
  }

  /** 删除角色权限关联 */
  async delete(id: number) {
    const result = await RolePermission.delete(id);
    await rbacCache.reload();
    return result;
  }

  /** 根据角色ID删除所有关联 */
  async deleteByRoleId(roleId: number) {
    const result = await RolePermission.deleteMany(where().eq("roleId", roleId));
    await rbacCache.reload();
    return result;
  }

  /** 批量设置角色权限 */
  async batchSetRolePermissions(roleId: number, permissionIds: number[]) {
    // 先删除该角色的所有权限关联
    await this.deleteByRoleId(roleId);
    
    // 批量创建新的关联
    const results = [];
    for (const permissionId of permissionIds) {
      const result = await this.create({ roleId, permissionId });
      results.push(result);
    }
    
    return results;
  }
}

export const rolePermissionService = new RolePermissionService();
