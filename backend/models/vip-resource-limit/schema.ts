import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** VIP 资源限制表 Schema */
const schema = {
  /** ID */
  id: column.number().primaryKey().autoIncrement(),
  /** VIP 等级 ID */
  vipTierId: column.number(),
  /** 资源键（如：scene:create） */
  resourceKey: column.string(),
  /** 限制值（-1 表示无限制） */
  limitValue: column.number(),
  /** 描述 */
  description: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
