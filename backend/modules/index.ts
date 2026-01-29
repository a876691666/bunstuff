import { Elysia } from "elysia";
import menuController, { menuAdminController } from "./menu";
import userController, { userAdminController } from "./users";
import roleController, { roleAdminController } from "./role";
import permissionController, { permissionAdminController } from "./permission";
import permissionScopeController, { permissionScopeAdminController } from "./permission-scope";
import roleMenuController, { roleMenuAdminController } from "./role-menu";
import rolePermissionController, { rolePermissionAdminController } from "./role-permission";
import rbacController, { rbacAdminController } from "./rbac";
import authController, { authAdminController } from "./auth";
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
    // 客户端路由
    .use(authController)
    .use(menuController)
    .use(userController)
    .use(roleController)
    .use(permissionController)
    .use(permissionScopeController)
    .use(roleMenuController)
    .use(rolePermissionController)
    .use(rbacController)
};

/** 创建管理端 API 路由 */
export const createAdminApi = (options: ApiOptions = {}) => {
  return new Elysia({ prefix: "/api/admin" })
    // 全局插件
    .use(authPlugin()) // Auth 插件默认启用
    .use(rbacPlugin()) // RBAC 插件默认不启用，通过 scope 配置启用
    // 管理端路由
    .use(authAdminController)
    .use(menuAdminController)
    .use(userAdminController)
    .use(roleAdminController)
    .use(permissionAdminController)
    .use(permissionScopeAdminController)
    .use(roleMenuAdminController)
    .use(rolePermissionAdminController)
    .use(rbacAdminController)
    .use(createSeedController(options.seed));
};

/** 默认 API 实例 */
export const api = createApi();

/** 默认管理端 API 实例 */
export const adminApi = createAdminApi();

export default api;
