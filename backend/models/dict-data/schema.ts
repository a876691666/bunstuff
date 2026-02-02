import { TimestampSchema, column } from '../../packages/orm'

/** 字典数据表 Schema */
export default class DictDataSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement()
  /** 字典类型 */
  dictType = column.string().default('')
  /** 字典标签 */
  label = column.string().default('')
  /** 字典键值 */
  value = column.string().default('')
  /** 样式属性 (css类名) */
  cssClass = column.string().nullable().default(null)
  /** 表格回显样式 */
  listClass = column.string().nullable().default(null)
  /** 排序 */
  sort = DictDataSchema.sort(0)
  /** 状态: 0-禁用 1-启用 */
  status = DictDataSchema.status(1)
  /** 是否默认: 0-否 1-是 */
  isDefault = column.number().default(0)
  /** 备注 */
  remark = column.string().nullable().default(null)
}
