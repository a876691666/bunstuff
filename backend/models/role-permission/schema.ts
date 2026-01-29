import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 角色权限关联表 Schema */
const schema = {
  /** 关联 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 角色ID (外键) */
  roleId: column.number(),
  /** 权限ID (外键) */
  permissionId: column.number(),
  /** 创建时间 */
  createdAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
