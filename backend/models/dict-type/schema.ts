import { TimestampSchema, column } from '../../packages/orm'

/** 字典类型表 Schema */
export default class DictTypeSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 字典名称 */
  name = column.string().default('').description('字典名称')
  /** 字典类型 (唯一标识) */
  type = column.string().unique().default('').description('字典类型')
  /** 状态: 0-禁用 1-启用 */
  status = DictTypeSchema.status(1).description('状态：1启用 0禁用')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
