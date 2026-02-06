import { db } from '../main'
import Schema from './schema'

/** SeedLog Model - Seed执行日志 */
const SeedLog = await db.model({
  tableName: 'seed_log',
  schema: Schema,
})

export default SeedLog
export { Schema }
