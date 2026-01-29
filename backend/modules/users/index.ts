import { Elysia } from "elysia";

// 导出管理端控制器
export { userAdminController } from "./admin";

/** 用户模块控制器（客户端） */
export const userController = new Elysia({ prefix: "/users", tags: ["用户"] });

export default userController;
