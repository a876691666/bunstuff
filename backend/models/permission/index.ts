import { db } from '../main'
import Schema from './schema'

/** Permission Model */
const Permission = await db.model({
  tableName: 'permission',
  schema: Schema,
})

export default Permission
export { Schema }
