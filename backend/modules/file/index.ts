/**
 * File 模块统一导出
 *
 * 包含子模块:
 * - main: 文件管理核心功能
 */

// ============ Main 模块导出 ============
export { fileAdminController } from './main/api_admin'
export { fileController } from './main/api_client'
export { fileService, FileService } from './main/service'
export type { StorageType, S3Config, FileServiceConfig } from './main/service'
export { filePlugin } from './main/plugin'
export type { FileContext } from './main/plugin'
export { SysFileSchema, fileIdParams, fileQueryParams } from './main/model'
