import { TimestampSchema, column } from '../../packages/orm'

/** CRUD 表配置 Schema */
export default class CrudTableSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 表名（唯一标识） */
  tableName = column.string().default('').description('表名')
  /** 显示名称 */
  displayName = column.string().default('').description('显示名称')
  /** 表结构定义 (JSON) - 存储列定义、类型等 */
  columns = column.string().default('[]').description('列定义JSON')
  /** 表描述 */
  description = column.string().nullable().default(null).description('表描述')
  /** 状态: 0-禁用 1-启用 */
  status = CrudTableSchema.status(1).description('状态：1启用 0禁用')
  /** 创建者ID */
  createBy = column.number().default(0).description('创建者ID')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
