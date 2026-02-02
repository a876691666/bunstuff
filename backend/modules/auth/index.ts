/**
 * Auth 模块统一导出
 *
 * 包含子模块:
 * - main: 认证核心功能 (登录/登出/Session管理)
 * - users: 用户管理
 */

// ============ Main 模块导出 ============
// 控制器
export { authAdminController } from './main/api_admin'
export { authController } from './main/api_client'

// 服务
export { authService, AuthService } from './main/service'
export type { LoginResult, RegisterResult } from './main/service'

// 插件
export { authPlugin } from './main/plugin'
export type { AuthPluginOptions } from './main/plugin'

// Session
export { sessionStore } from './main/session'
export type { Session } from './main/session'

// ============ Users 模块导出 ============
// 控制器
export { userAdminController } from './users/api_admin'

// 服务
export { userService, UserService } from './users/service'

// 模型
export {
  UserSchema,
  createUserBody,
  updateUserBody,
  userIdParams,
  userQueryParams,
} from './users/model'

// 默认导出
export { authController as default } from './main/api_client'
