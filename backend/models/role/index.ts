import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** Role Model */
const Role = await db.model({
  tableName: 'role',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 角色行类型 */
export type RoleRow = InferRow<SchemaType>
/** 角色插入类型 */
export type RoleInsert = InsertData<SchemaType>
/** 角色更新类型 */
export type RoleUpdate = UpdateData<SchemaType>

export default Role
export { Schema }
