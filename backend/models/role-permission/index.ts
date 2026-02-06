import { db } from '../main'
import Schema from './schema'

/** RolePermission Model - 角色权限关联 */
const RolePermission = await db.model({
  tableName: 'role_permission',
  schema: Schema,
})

export default RolePermission
export { Schema }
