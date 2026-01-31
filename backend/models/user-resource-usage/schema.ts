import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 用户资源使用表 Schema */
const schema = {
  /** ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 用户 ID */
  userId: column.number(),
  /** 资源键 */
  resourceKey: column.string(),
  /** 已使用数量 */
  usageCount: column.number().default(0),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
