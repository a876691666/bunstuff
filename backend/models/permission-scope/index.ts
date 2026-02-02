import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** PermissionScope Model - 数据过滤规则 */
const PermissionScope = await db.model({
  tableName: 'permission_scope',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 数据过滤规则行类型 */
export type PermissionScopeRow = InferRow<SchemaType>
/** 数据过滤规则插入类型 */
export type PermissionScopeInsert = InsertData<SchemaType>
/** 数据过滤规则更新类型 */
export type PermissionScopeUpdate = UpdateData<SchemaType>

export default PermissionScope
export { Schema }
