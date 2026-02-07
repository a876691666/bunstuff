/**
 * System 模块统一导出
 *
 * 包含子模块:
 * - dict: 字典管理
 * - config: 参数配置
 * - login-log: 登录日志
 * - oper-log: 操作日志
 */

// ============ Dict 模块导出 ============
export { dictAdminController } from './dict/api_admin'
export { dictController } from './dict/api_client'
export { dictService, DictService, dictCache } from './dict/service'
export { dictPlugin } from './dict/plugin'
export type { DictContext } from './dict/plugin'

// ============ Config 模块导出 ============
export { configAdminController } from './config/api_admin'
export { configController } from './config/api_client'
export { configService, ConfigService, configCache } from './config/service'
export { configPlugin } from './config/plugin'
export type { ConfigContext } from './config/plugin'

// ============ LoginLog 模块导出 ============
export { loginLogAdminController } from './login-log/api_admin'
export { loginLogService, LoginLogService } from './login-log/service'
export type { LoginAction } from './login-log/service'
export { loginLogPlugin } from './login-log/plugin'
export type { LoginLogContext } from './login-log/plugin'

// ============ OperLog 模块导出 ============
export { operLogAdminController } from './oper-log/api_admin'
export { operLogService, OperLogService } from './oper-log/service'
export type { OperType } from './oper-log/service'
export { operLogPlugin } from './oper-log/plugin'
export type { OperLogContext } from './oper-log/plugin'