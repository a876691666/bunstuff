import { db } from '../main'
import Schema from './schema'

/** JobLog Model - 任务执行日志 */
const JobLog = await db.model({
  tableName: 'job_log',
  schema: Schema,
})

export default JobLog
export { Schema }
