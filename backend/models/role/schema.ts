import { TimestampSchema, column } from "../../packages/orm";

/** 角色表 Schema (树形结构) */
export default class RoleSchema extends TimestampSchema {
  /** 角色 ID */
  id = column.number().primaryKey().autoIncrement();
  /** 父角色ID (自引用，用于树形结构) */
  parentId = column.number().nullable().default(null);
  /** 角色名称 */
  name = column.string().default("");
  /** 角色编码 */
  code = column.string().unique().default("");
  /** 状态: 0-禁用 1-启用 */
  status = RoleSchema.status(1);
  /** 排序 */
  sort = RoleSchema.sort(0);
  /** 角色描述 */
  description = column.string().nullable().default(null);
}
