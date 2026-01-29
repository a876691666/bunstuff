import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** Seed日志表 Schema */
const schema = {
  /** ID */
  id: column.number().primaryKey().autoIncrement(),
  /** Seed名称（唯一标识） */
  name: column.string().unique(),
  /** Seed描述 */
  description: column.string().nullable(),
  /** 执行时间 */
  executedAt: column.string(),
  /** 执行状态: 0-失败 1-成功 */
  status: column.number().default(1),
  /** 错误信息 */
  errorMessage: column.string().nullable(),
} satisfies SchemaDefinition;

export default schema;
