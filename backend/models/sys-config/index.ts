import { db } from '../main'
import Schema from './schema'

/** SysConfig Model - 系统参数配置 */
const SysConfig = await db.model({
  tableName: 'sys_config',
  schema: Schema,
})

export default SysConfig
export { Schema }
