import { db } from '../main'
import Schema from './schema'

/** Session Model */
const Session = await db.model({
  tableName: 'session',
  schema: Schema,
})

export default Session
export { Schema }
