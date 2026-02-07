import { db } from '../main'
import Schema from './schema'

/** IpBlacklist Model - IP黑名单 */
const IpBlacklist = await db.model({
  tableName: 'ip_blacklist',
  schema: Schema,
})

export default IpBlacklist
export { Schema }
