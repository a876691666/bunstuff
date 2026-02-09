import { db } from '../main'
import Schema from './schema'

/** CrudTable Model - CRUD 表配置 */
const CrudTable = await db.model({
  tableName: 'crud_table',
  schema: Schema,
})

export default CrudTable
export { Schema }
