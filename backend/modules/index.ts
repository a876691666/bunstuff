import { Elysia } from "elysia";
import menuController from "./menu";
import userController from "./users";
import roleController from "./role";
import permissionController from "./permission";
import permissionScopeController from "./permission-scope";
import roleMenuController from "./role-menu";
import rolePermissionController from "./role-permission";
import rbacController from "./rbac";
import authController from "./auth";
import { createSeedController } from "./seed";
import { authPlugin } from "./auth/plugin";
import { rbacPlugin } from "./rbac/plugin";

/** API 模块配置 */
export interface ApiOptions {
  /** Seed 模块配置 */
  seed?: {
    /** 是否在初始化时自动执行所有未执行的 Seeds，默认 false */
    autoRun?: boolean;
  };
}

/** 创建 API 路由 */
export const createApi = (options: ApiOptions = {}) => {
  return new Elysia({ prefix: "/api" })
    // 全局插件
    .use(authPlugin()) // Auth 插件默认启用
    .use(rbacPlugin()) // RBAC 插件默认不启用，通过 scope 配置启用
    // 路由
    .use(authController)
    .use(menuController)
    .use(userController)
    .use(roleController)
    .use(permissionController)
    .use(permissionScopeController)
    .use(roleMenuController)
    .use(rolePermissionController)
    .use(rbacController)
    .use(createSeedController(options.seed));
};

/** 默认 API 实例 */
export const api = createApi();

export default api;
