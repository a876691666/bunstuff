import { db } from '../main'
import Schema from './schema'

/** RateLimitRule Model - 限流规则 */
const RateLimitRule = await db.model({
  tableName: 'rate_limit_rule',
  schema: Schema,
})

export default RateLimitRule
export { Schema }
