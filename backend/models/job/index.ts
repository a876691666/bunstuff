import { db } from '../main'
import Schema from './schema'

/** Job Model - 定时任务 */
const Job = await db.model({
  tableName: 'job',
  schema: Schema,
})

export default Job
export { Schema }
