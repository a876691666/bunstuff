import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** VipResourceLimit Model */
const VipResourceLimit = await db.model({
  tableName: 'vip_resource_limit',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** VIP 资源限制行类型 */
export type VipResourceLimitRow = InferRow<SchemaType>
/** VIP 资源限制插入类型 */
export type VipResourceLimitInsert = InsertData<SchemaType>
/** VIP 资源限制更新类型 */
export type VipResourceLimitUpdate = UpdateData<SchemaType>

export default VipResourceLimit
export { Schema }
