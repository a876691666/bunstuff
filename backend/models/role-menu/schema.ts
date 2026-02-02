import { Schema, column } from '../../packages/orm'

/** 角色菜单关联表 Schema */
export default class RoleMenuSchema extends Schema {
  /** 关联 ID */
  id = column.number().primaryKey().autoIncrement()
  /** 角色ID (外键) */
  roleId = column.number().default(0)
  /** 菜单ID (外键) */
  menuId = column.number().default(0)
  /** 创建时间 */
  createdAt = Schema.createdAt()
}
