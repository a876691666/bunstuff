import { db } from '../main'
import Schema from './schema'

/** UserResourceUsage Model */
const UserResourceUsage = await db.model({
  tableName: 'user_resource_usage',
  schema: Schema,
})

export default UserResourceUsage
export { Schema }
