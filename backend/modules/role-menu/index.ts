import { Elysia } from "elysia";

// 导出管理端控制器
export { roleMenuAdminController } from "./admin";

/** 角色菜单模块控制器（客户端） */
export const roleMenuController = new Elysia({ prefix: "/role-menu", tags: ["角色菜单"] });

export default roleMenuController;
