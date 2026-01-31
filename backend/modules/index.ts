import { Elysia } from "elysia";
import { menuAdminController } from "./menu";
import { userAdminController } from "./users";
import { roleAdminController } from "./role";
import { permissionAdminController } from "./permission";
import { permissionScopeAdminController } from "./permission-scope";
import { roleMenuAdminController } from "./role-menu";
import { rolePermissionAdminController } from "./role-permission";
import { rbacController, rbacAdminController } from "./rbac";
import { authController, authAdminController } from "./auth";
import { createSeedController } from "./seed";
import { authPlugin } from "./auth/plugin";
import { rbacPlugin } from "./rbac/plugin";
import { vipAdminController } from "./vip";
import { vipPlugin } from "./vip/plugin";

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
    .use(vipPlugin()) // VIP 插件默认不启用，通过 scope.vip 配置启用
    // 客户端路由（只有 auth 和 rbac 有客户端接口）
    .use(authController)
    .use(rbacController)
};

/** 创建管理端 API 路由 */
export const createAdminApi = (options: ApiOptions = {}) => {
  return new Elysia({ prefix: "/api/admin" })
    // 全局插件
    .use(authPlugin()) // Auth 插件默认启用
    .use(rbacPlugin()) // RBAC 插件默认不启用，通过 scope 配置启用
    .use(vipPlugin()) // VIP 插件默认不启用，通过 scope.vip 配置启用
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
    .use(vipAdminController)
    .use(createSeedController(options.seed));
};

/** 默认 API 实例 */
export const api = createApi();

/** 默认管理端 API 实例 */
export const adminApi = createAdminApi();

export default api;
