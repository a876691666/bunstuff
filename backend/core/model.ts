import { db } from '@/models/main'

// 类型定义由 scripts/gen-registry.ts 自动生成
export type { ModelRegistry, SessionRow, SessionInsert, SessionUpdate } from '../_generated/model.generated'
import type { ModelRegistry } from '../_generated/model.generated'

// 运行时 Schema 注册表（编译时生成）
import { schemaModules } from '../_generated/schemas.generated'

/** 所有已注册的 Model 实例 */
export const model = {} as ModelRegistry

/** 数据库实例 */
export { db }

// ===== 使用编译时生成的静态导入加载所有 Model =====
for (const { tableName, Schema } of schemaModules) {
  if (!tableName || !Schema) {
    console.warn(`⚠️ Skipping schema: missing tableName or Schema export`)
    continue
  }
  ;(model as any)[tableName] = await db.model({ tableName, schema: Schema })
}
