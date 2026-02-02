import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** SeedLog Model - Seed执行日志 */
const SeedLog = await db.model({
  tableName: 'seed_log',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** Seed日志行类型 */
export type SeedLogRow = InferRow<SchemaType>
/** Seed日志插入类型 */
export type SeedLogInsert = InsertData<SchemaType>
/** Seed日志更新类型 */
export type SeedLogUpdate = UpdateData<SchemaType>

export default SeedLog
export { Schema }
