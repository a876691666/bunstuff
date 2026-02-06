import { db } from '../main'
import Schema from './schema'

/** VipTier Model */
const VipTier = await db.model({
  tableName: 'vip_tier',
  schema: Schema,
})

export default VipTier
export { Schema }
