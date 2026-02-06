import { db } from '../main'
import Schema from './schema'

/** DictType Model - 字典类型 */
const DictType = await db.model({
  tableName: 'dict_type',
  schema: Schema,
})

export default DictType
export { Schema }
