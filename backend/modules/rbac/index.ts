/**
 * RBAC 模块统一导出
 *
 * 包含子模块:
 * - main: RBAC核心功能 (权限检查/缓存)
 * - menu: 菜单管理
 * - permission: 权限管理
 * - permission-scope: 数据权限管理
 * - role: 角色管理
 * - role-menu: 角色菜单关联
 * - role-permission: 角色权限关联
 */

// ============ Main 模块导出 ============
// 控制器
export { rbacAdminController } from './main/api_admin'
export { rbacController } from './main/api_client'

// 服务
export { rbacService, RbacService } from './main/service'
export type { UserPermissionInfo, MenuTreeNode } from './main/service'

// 插件
export { rbacPlugin } from './main/plugin'
export type { RbacScope, DataScope } from './main/plugin'

// 缓存
export { rbacCache } from './main/cache'
export type { CachedRole, CachedPermission } from './main/cache'

// ============ Menu 模块导出 ============
export { menuAdminController } from './menu/api_admin'
export { menuService, MenuService } from './menu/service'

// ============ Permission 模块导出 ============
export { permissionAdminController } from './permission/api_admin'
export { permissionService, PermissionService } from './permission/service'

// ============ Permission-Scope 模块导出 ============
export { permissionScopeAdminController } from './permission-scope/api_admin'
export { permissionScopeService, PermissionScopeService } from './permission-scope/service'

// ============ Role 模块导出 ============
export { roleAdminController } from './role/api_admin'
export { roleService, RoleService } from './role/service'

// ============ Role-Menu 模块导出 ============
export { roleMenuAdminController } from './role-menu/api_admin'
export { roleMenuService, RoleMenuService } from './role-menu/service'

// ============ Role-Permission 模块导出 ============
export { rolePermissionAdminController } from './role-permission/api_admin'
export { rolePermissionService, RolePermissionService } from './role-permission/service'

// 默认导出
export { rbacController as default } from './main/api_client'
