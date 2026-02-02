import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** SysConfig Model - 系统参数配置 */
const SysConfig = await db.model({
  tableName: 'sys_config',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 系统参数行类型 */
export type SysConfigRow = InferRow<SchemaType>
/** 系统参数插入类型 */
export type SysConfigInsert = InsertData<SchemaType>
/** 系统参数更新类型 */
export type SysConfigUpdate = UpdateData<SchemaType>

export default SysConfig
export { Schema }
