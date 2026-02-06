import { db } from '../main'
import Schema from './schema'

/** VipResourceLimit Model */
const VipResourceLimit = await db.model({
  tableName: 'vip_resource_limit',
  schema: Schema,
})

export default VipResourceLimit
export { Schema }
