import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** RoleMenu Model - 角色菜单关联 */
const RoleMenu = await db.model({
  tableName: 'role_menu',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 角色菜单关联行类型 */
export type RoleMenuRow = InferRow<SchemaType>
/** 角色菜单关联插入类型 */
export type RoleMenuInsert = InsertData<SchemaType>
/** 角色菜单关联更新类型 */
export type RoleMenuUpdate = UpdateData<SchemaType>

export default RoleMenu
export { Schema }
