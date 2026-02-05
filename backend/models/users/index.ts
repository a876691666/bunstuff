import type { InferRow, InsertData, UpdateData, InstanceKeys } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** UsersSchema 字段键名 */
export type UserSchemaKeys = keyof InstanceType<typeof Schema>

/** User Model */
const User = await db.model({
  tableName: 'users',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 用户行类型 */
export type UserRow = InferRow<SchemaType>
/** 用户插入类型 */
export type UserInsert = InsertData<SchemaType>
/** 用户更新类型 */
export type UserUpdate = UpdateData<SchemaType>

export default User
export { Schema }
