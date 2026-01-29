import { Elysia } from "elysia";

// 导出管理端控制器
export { permissionScopeAdminController } from "./admin";

/** 数据权限模块控制器（客户端） */
export const permissionScopeController = new Elysia({ prefix: "/permission-scope", tags: ["数据权限"] });

export default permissionScopeController;
