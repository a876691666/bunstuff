import { db } from '../main'
import Schema from './schema'

/** RoleMenu Model - 角色菜单关联 */
const RoleMenu = await db.model({
  tableName: 'role_menu',
  schema: Schema,
})

export default RoleMenu
export { Schema }
