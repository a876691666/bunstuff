import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** Session Model */
const Session = await db.model({
  tableName: 'session',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 会话行类型 */
export type SessionRow = InferRow<SchemaType>
/** 会话插入类型 */
export type SessionInsert = InsertData<SchemaType>
/** 会话更新类型 */
export type SessionUpdate = UpdateData<SchemaType>

export default Session
export { Schema }
