import { db } from '../main'
import Schema from './schema'

/** DictData Model - 字典数据 */
const DictData = await db.model({
  tableName: 'dict_data',
  schema: Schema,
})

export default DictData
export { Schema }
