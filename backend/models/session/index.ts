import type { Row, Insert, Update } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** Session Model */
const Session = await db.model({
  tableName: 'session',
  schema: Schema,
})

export default Session
export { Schema }
export type SessionRow = Row<typeof Session>
export type SessionInsert = Insert<typeof Session>
export type SessionUpdate = Update<typeof Session>
