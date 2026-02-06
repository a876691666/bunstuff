import { db } from '../main'
import Schema from './schema'

/** SysFile Model - 文件元数据 */
const SysFile = await db.model({
  tableName: 'sys_file',
  schema: Schema,
})

export default SysFile
export { Schema }
