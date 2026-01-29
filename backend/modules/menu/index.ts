import { Elysia } from "elysia";

// 导出管理端控制器
export { menuAdminController } from "./admin";

/** 菜单模块控制器（客户端） */
export const menuController = new Elysia({ prefix: "/menu", tags: ["菜单"] });

export default menuController;
