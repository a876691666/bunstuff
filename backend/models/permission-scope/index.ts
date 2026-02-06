import { db } from '../main'
import Schema from './schema'

/** PermissionScope Model - 数据过滤规则 */
const PermissionScope = await db.model({
  tableName: 'permission_scope',
  schema: Schema,
})

export default PermissionScope
export { Schema }
