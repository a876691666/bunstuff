import { db } from '../main'
import Schema from './schema'

/** User Model */
const User = await db.model({
  tableName: 'users',
  schema: Schema,
})

export default User
export { Schema }
