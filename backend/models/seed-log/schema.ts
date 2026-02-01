import { Schema, column } from "../../packages/orm";

/** Seed日志表 Schema */
export default class SeedLogSchema extends Schema {
  /** ID */
  id = column.number().primaryKey().autoIncrement();
  /** Seed名称（唯一标识） */
  name = column.string().unique().default("");
  /** Seed描述 */
  description = column.string().nullable().default(null);
  /** 执行时间 */
  executedAt = column.string().default("");
  /** 执行状态: 0-失败 1-成功 */
  status = Schema.status(1);
  /** 错误信息 */
  errorMessage = column.string().nullable().default(null);
}
