import { db } from '../main'
import Schema from './schema'

/** LoginLog Model - 登录日志 */
const LoginLog = await db.model({
  tableName: 'login_log',
  schema: Schema,
})

export default LoginLog
export { Schema }
