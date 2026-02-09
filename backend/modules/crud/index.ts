/**
 * CRUD 模块统一导出
 *
 * 包含子模块:
 * - main: CRUD 表配置管理 + 通用 CRUD 通配接口
 *
 * 使用方式:
 * ```ts
 * import { crudRegistry } from '@/modules/crud'
 * import Notice from '@/models/notice'
 *
 * // 1. 代码级注册 ORM Model
 * crudRegistry.register(Notice)
 *
 * // 2. 管理员在 CrudTable 中创建/启用记录 → 自动同步到 Registry
 * // 3. GET /api/crud/notice 即可使用
 * ```
 */

// ============ Main 模块导出 ============
export { crudAdminController } from './main/api_admin'
export { crudController } from './main/api'
export { crudTableService, CrudTableService, crudRegistry } from './main/service'
export type { ColumnDef } from './main/service'
