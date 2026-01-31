/**
 * Permission-Scope 模块统一导出
 */

// 管理端控制器
export { permissionScopeAdminController, default } from "./api_admin";

// 服务
export { permissionScopeService } from "./service";

// 模型
export * from "./model";
