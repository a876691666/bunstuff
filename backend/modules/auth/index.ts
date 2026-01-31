/**
 * Auth 模块统一导出
 */

// 管理端控制器
export { authAdminController } from "./api_admin";

// 客户端控制器
export { authController } from "./api_client";
export { default } from "./api_client";

// 服务
export { authService } from "./service";

// 插件
export { authPlugin } from "./plugin";
