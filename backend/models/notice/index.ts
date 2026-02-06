import { db } from '../main'
import Schema from './schema'

/** Notice Model - 通知公告 */
const Notice = await db.model({
  tableName: 'notice',
  schema: Schema,
})

export default Notice
export { Schema }
