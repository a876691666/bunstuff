import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** RolePermission Model - 角色权限关联 */
const RolePermission = await db.model({
  tableName: 'role_permission',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 角色权限关联行类型 */
export type RolePermissionRow = InferRow<SchemaType>
/** 角色权限关联插入类型 */
export type RolePermissionInsert = InsertData<SchemaType>
/** 角色权限关联更新类型 */
export type RolePermissionUpdate = UpdateData<SchemaType>

export default RolePermission
export { Schema }
