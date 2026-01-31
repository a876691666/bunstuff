/**
 * Role-Permission 模块统一导出
 */

// 管理端控制器
export { rolePermissionAdminController, default } from "./api_admin";

// 服务
export { rolePermissionService } from "./service";

// 模型
export * from "./model";
