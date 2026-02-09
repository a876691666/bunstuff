import { Elysia } from 'elysia'
// Auth 模块
import { authController, authAdminController, userAdminController } from './auth'
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
} from './rbac'
// VIP 模块
import { vipAdminController } from './vip'
// Seed 模块
import { createSeedController } from './seed'
// System 模块
import {
  dictController,
  dictAdminController,
  configController,
  configAdminController,
  loginLogAdminController,
  operLogAdminController,
  rateLimitRuleAdminController,
  ipBlacklistAdminController,
} from './system'
// Job 模块
import { jobAdminController, jobLogAdminController } from './job'
// Notice 模块
import { noticeController, noticeAdminController } from './notice'
// File 模块
import { fileController, fileAdminController } from './file'
// CRUD 模块
import { crudController, crudAdminController } from './crud'

/** 创建 API 路由 */
export const createApi = () => {
  return (
    new Elysia({ prefix: '/api' })
      .use(authController)
      .use(rbacController)
      // System 子模块
      .use(dictController)
      .use(configController)
      // Notice 模块
      .use(noticeController)
      // File 模块
      .use(fileController)
      // CRUD 模块
      .use(crudController)
  )
}

/** 创建管理端 API 路由 */
export const createAdminApi = () => {
  return (
    new Elysia({ prefix: '/api/admin' })
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
      .use(operLogAdminController)
      .use(rateLimitRuleAdminController)
      .use(ipBlacklistAdminController)
      // Notice 模块
      .use(noticeAdminController)
      // Job 模块
      .use(jobAdminController)
      .use(jobLogAdminController)
      // File 模块
      .use(fileAdminController)
      // CRUD 模块
      .use(crudAdminController)
      // Seed 模块（仅 API 路由，seed 已在启动时执行完毕）
      .use(createSeedController())
  )
}
