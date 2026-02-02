/**
 * RBAC Main 模块统一导出
 */

// 管理端控制器
export { rbacAdminController } from './api_admin'

// 客户端控制器
export { rbacController } from './api_client'
export { default } from './api_client'

// 服务
export { rbacService, RbacService } from './service'
export type { UserPermissionInfo, MenuTreeNode } from './service'

// 插件
export { rbacPlugin } from './plugin'
export type { RbacScope, DataScope } from './plugin'

// 缓存
export { rbacCache } from './cache'
export type { CachedRole, CachedPermission } from './cache'
