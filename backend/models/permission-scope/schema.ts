import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 数据过滤规则表 Schema */
const schema = {
  /** 规则 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 权限ID (外键) */
  permissionId: column.number(),
  /** 规则名称 */
  name: column.string(),
  /** 规则指向的表名 */
  tableName: column.string(),
  /** SSQL过滤表达式，例如: dept_id == $user.dept_id */
  ssqlRule: column.string(),
  /** 规则描述 */
  description: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
