import { Elysia } from "elysia";
// Auth 模块
import { authController, authAdminController, userAdminController } from "./auth";
// RBAC 模块
import {
  rbacController,
  rbacAdminController,
  menuAdminController,
  roleAdminController,
  permissionAdminController,
  permissionScopeAdminController,
  roleMenuAdminController,
  rolePermissionAdminController,
} from "./rbac";
// VIP 模块
import { vipAdminController } from "./vip";
// Seed 模块
import { createSeedController } from "./seed";
// System 模块
import {
  dictController,
  dictAdminController,
  configController,
  configAdminController,
  loginLogAdminController,
} from "./system";
// Notice 模块
import { noticeController, noticeAdminController } from "./notice";
// File 模块
import { fileController, fileAdminController } from "./file";

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
  return (
    new Elysia({ prefix: "/api" })
      .use(authController)
      .use(rbacController)
      // System 子模块
      .use(dictController)
      .use(configController)
      // Notice 模块
      .use(noticeController)
      // File 模块
      .use(fileController)
  );
};

/** 创建管理端 API 路由 */
export const createAdminApi = (options: ApiOptions = {}) => {
  return (
    new Elysia({ prefix: "/api/admin" })
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
      // System 子模块
      .use(dictAdminController)
      .use(configAdminController)
      .use(loginLogAdminController)
      // Notice 模块
      .use(noticeAdminController)
      // File 模块
      .use(fileAdminController)
      // Seed 模块
      .use(createSeedController(options.seed))
  );
};

/** 默认 API 实例 */
export const api = createApi();

/** 默认管理端 API 实例 */
export const adminApi = createAdminApi();

export default api;
