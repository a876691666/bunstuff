import { TimestampSchema, column } from '../../packages/orm'

/** 字典数据表 Schema */
export default class DictDataSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 字典类型 */
  dictType = column.string().default('').description('字典类型')
  /** 字典标签 */
  label = column.string().default('').description('字典标签')
  /** 字典键值 */
  value = column.string().default('').description('字典键值')
  /** 样式属性 (css类名) */
  cssClass = column.string().nullable().default(null).description('样式属性')
  /** 表格回显样式 */
  listClass = column.string().nullable().default(null).description('表格回显样式')
  /** 排序 */
  sort = DictDataSchema.sort(0).description('排序值')
  /** 状态: 0-禁用 1-启用 */
  status = DictDataSchema.status(1).description('状态：1启用 0禁用')
  /** 是否默认: 0-否 1-是 */
  isDefault = column.number().default(0).description('是否默认：1是 0否')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
