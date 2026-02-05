import { TimestampSchema, column } from '../../packages/orm'

/** 系统参数配置表 Schema */
export default class SysConfigSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 参数名称 */
  name = column.string().default('').description('参数名称')
  /** 参数键名 (唯一标识) */
  key = column.string().unique().default('').description('参数键名')
  /** 参数键值 */
  value = column.string().default('').description('参数键值')
  /** 系统内置: 0-否 1-是 (内置参数不可删除) */
  isBuiltin = column.number().default(0).description('系统内置：1是 0否')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
