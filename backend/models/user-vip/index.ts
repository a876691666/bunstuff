import { db } from '../main'
import Schema from './schema'

/** UserVip Model */
const UserVip = await db.model({
  tableName: 'user_vip',
  schema: Schema,
})

export default UserVip
export { Schema }
