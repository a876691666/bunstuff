import { db } from '../main'
import Schema from './schema'

/** NoticeRead Model - 通知已读记录 */
const NoticeRead = await db.model({
  tableName: 'notice_read',
  schema: Schema,
})

export default NoticeRead
export { Schema }
