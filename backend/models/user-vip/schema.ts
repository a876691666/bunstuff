import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 用户 VIP 表 Schema */
const schema = {
  /** ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 用户 ID */
  userId: column.number(),
  /** VIP 等级 ID */
  vipTierId: column.number(),
  /** 过期时间（NULL 表示永久） */
  expireTime: column.date().nullable(),
  /** 状态: 0-禁用 1-启用 */
  status: column.number().default(1),
  /** 绑定回调状态: 0-待确认 1-已确认 */
  bindingStatus: column.number().default(0),
  /** 绑定时用户原角色ID（用于回滚） */
  originalRoleId: column.number().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
