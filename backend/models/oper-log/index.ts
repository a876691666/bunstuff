import { db } from '../main'
import Schema from './schema'

/** OperLog Model - 操作日志 */
const OperLog = await db.model({
  tableName: 'oper_log',
  schema: Schema,
})

export default OperLog
export { Schema }
