import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** UserVip Model */
const UserVip = await db.model({
  tableName: 'user_vip',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 用户 VIP 行类型 */
export type UserVipRow = InferRow<SchemaType>
/** 用户 VIP 插入类型 */
export type UserVipInsert = InsertData<SchemaType>
/** 用户 VIP 更新类型 */
export type UserVipUpdate = UpdateData<SchemaType>

export default UserVip
export { Schema }
