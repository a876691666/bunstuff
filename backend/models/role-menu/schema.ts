import { Schema, column } from '../../packages/orm'

/** 角色菜单关联表 Schema */
export default class RoleMenuSchema extends Schema {
  /** 关联 ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 角色ID (外键) */
  roleId = column.number().default(0).description('角色ID')
  /** 菜单ID (外键) */
  menuId = column.number().default(0).description('菜单ID')
  /** 创建时间 */
  createdAt = Schema.createdAt()
}
