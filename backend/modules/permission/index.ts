import { Elysia } from "elysia";

// 导出管理端控制器
export { permissionAdminController } from "./admin";

/** 权限模块控制器（客户端） */
export const permissionController = new Elysia({ prefix: "/permission", tags: ["权限"] });

export default permissionController;
