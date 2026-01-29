import { Elysia } from "elysia";

// 导出管理端控制器
export { roleAdminController } from "./admin";

/** 角色模块控制器（客户端） */
export const roleController = new Elysia({ prefix: "/role", tags: ["角色"] });

export default roleController;
