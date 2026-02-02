import { TimestampSchema, column } from '../../packages/orm'

/** 菜单表 Schema (树形结构) */
export default class MenuSchema extends TimestampSchema {
  /** 菜单 ID */
  id = column.number().primaryKey().autoIncrement()
  /** 父菜单ID (用于目录-页面两级结构) */
  parentId = column.number().nullable().default(null)
  /** 菜单名称 */
  name = column.string().default('')
  /** 路由路径 */
  path = column.string().default('')
  /** 组件路径 */
  component = column.string().nullable().default(null)
  /** 图标 */
  icon = column.string().nullable().default(null)
  /** 菜单类型: 1-目录 2-菜单 3-按钮 */
  type = column.number().default(2)
  /** 是否可见: 0-隐藏 1-显示 */
  visible = column.number().default(1)
  /** 状态: 0-禁用 1-启用 */
  status = MenuSchema.status(1)
  /** 重定向地址 */
  redirect = column.string().nullable().default(null)
  /** 排序 */
  sort = MenuSchema.sort(0)
  /** 权限编码 (关联Permission.code) */
  permCode = column.string().nullable().default(null)
}
