import { db } from '../main'
import Schema from './schema'

/** Menu Model - 菜单 */
const Menu = await db.model({
  tableName: 'menu',
  schema: Schema,
})

export default Menu
export { Schema }
