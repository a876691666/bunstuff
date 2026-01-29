import type { SeedDefinition } from "../../modules/seed/service";
import { where } from "@pkg/ssql";
import PermissionScope from "./index";
import Permission from "../permission";

/** 数据过滤规则 Seed */
export const permissionScopeSeed: SeedDefinition = {
  name: "permission-scope-default",
  description: "初始化数据过滤规则示例数据",
  async run() {
    // 获取用户列表权限
    const userListPermission = await Permission.findOne({ where: where().eq("code", "user:list") });
    if (!userListPermission) {
      throw new Error("user:list 权限不存在，请先执行 permission-default seed");
    }

    // 创建示例数据过滤规则
    const scopes = [
      {
        permissionId: userListPermission.id,
        name: "只能查看同部门用户",
        tableName: "users",
        ssqlRule: "dept_id == $user.dept_id",
        description: "限制用户只能查看自己部门的用户数据",
      },
      {
        permissionId: userListPermission.id,
        name: "只能查看自己创建的用户",
        tableName: "users",
        ssqlRule: "created_by == $user.id",
        description: "限制用户只能查看自己创建的用户数据",
      },
    ];

    for (const scope of scopes) {
      await PermissionScope.create(scope);
    }
    console.log(`✅ 已创建 ${scopes.length} 个数据过滤规则示例`);
  },
};

export default permissionScopeSeed;
