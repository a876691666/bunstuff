import { db } from '../main'
import Schema from './schema'

/** Role Model */
const Role = await db.model({
  tableName: 'role',
  schema: Schema,
})

export default Role
export { Schema }
