import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 权限表 Schema */
const schema = {
  /** 权限 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 权限名称 */
  name: column.string(),
  /** 权限编码 */
  code: column.string().unique(),
  /** 资源标识 */
  resource: column.string().nullable(),
  /** 权限描述 */
  description: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
