import { Elysia } from "elysia";

// 导出管理端控制器
export { rolePermissionAdminController } from "./admin";

/** 角色权限模块控制器（客户端） */
export const rolePermissionController = new Elysia({ prefix: "/role-permission", tags: ["角色权限"] });

export default rolePermissionController;
