/**
 * Permission 模块统一导出
 */

// 管理端控制器
export { permissionAdminController, default } from "./api_admin";

// 服务
export { permissionService } from "./service";

// 模型
export * from "./model";
