import type { InferRow, InsertData, UpdateData } from '../../packages/orm'
import { db } from '../main'
import Schema from './schema'

/** Menu Model - 菜单 */
const Menu = await db.model({
  tableName: 'menu',
  schema: Schema,
})

type SchemaType = ReturnType<typeof Schema.getDefinition>

/** 菜单行类型 */
export type MenuRow = InferRow<SchemaType>
/** 菜单插入类型 */
export type MenuInsert = InsertData<SchemaType>
/** 菜单更新类型 */
export type MenuUpdate = UpdateData<SchemaType>

export default Menu
export { Schema }
