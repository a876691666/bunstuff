/**
 * RBAC 模块统一导出
 */

// 管理端控制器
export { rbacAdminController } from "./api_admin";

// 客户端控制器
export { rbacController } from "./api_client";
export { default } from "./api_client";

// 服务
export { rbacService } from "./service";

// 插件
export { rbacPlugin } from "./plugin";

// 缓存
export { rbacCache } from "./cache";
