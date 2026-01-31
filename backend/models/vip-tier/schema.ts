import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** VIP 等级表 Schema */
const schema = {
  /** VIP 等级 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** VIP 名称 */
  name: column.string(),
  /** VIP 代码 */
  code: column.string().unique(),
  /** 默认绑定角色 ID */
  roleId: column.number().nullable(),
  /** 价格 */
  price: column.number().default(0),
  /** 有效期天数（0 表示永久） */
  durationDays: column.number().default(0),
  /** 状态: 0-禁用 1-启用 */
  status: column.number().default(1),
  /** 描述 */
  description: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
