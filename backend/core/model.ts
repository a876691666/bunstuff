import { Glob } from 'bun'
import { join } from 'path'
import { db } from '@/models/main'

// 类型定义由 scripts/gen-models.ts 自动生成
export type { ModelRegistry, SessionRow, SessionInsert, SessionUpdate } from './model.generated'
import type { ModelRegistry } from './model.generated'

/** 所有已注册的 Model 实例 */
export const model = {} as ModelRegistry

/** 数据库实例 */
export { db }

// ===== Runtime: Glob 自动加载所有 Model =====
const glob = new Glob('*/schema.ts')
const modelsDir = join(import.meta.dir, '../models')

for await (const file of glob.scan({ cwd: modelsDir })) {
  const mod = await import(join(modelsDir, file))
  const { default: Schema, tableName } = mod
  if (!tableName || !Schema) {
    console.warn(`⚠️ Skipping ${file}: missing tableName or default Schema export`)
    continue
  }
  ;(model as any)[tableName] = await db.model({ tableName, schema: Schema })
}
