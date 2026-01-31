/**
 * VIP 模块统一导出
 */

// 管理端控制器
export { vipAdminController, default } from "./api_admin";

// 插件
export { vipPlugin, type VipScope, type VipContext } from "./plugin";

// 服务
export { vipService, VipService, type VipBindingCallback } from "./service";

// 模型
export * from "./model";
