import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** DictData Model - 字典数据 */
const DictData = await db.model({
  tableName: 'dict_data',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 字典数据行类型 */
export type DictDataRow = InferRow<SchemaType>
/** 字典数据插入类型 */
export type DictDataInsert = InsertData<SchemaType>
/** 字典数据更新类型 */
export type DictDataUpdate = UpdateData<SchemaType>

export default DictData
export { Schema }
