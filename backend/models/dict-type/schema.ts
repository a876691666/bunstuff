import { TimestampSchema, column } from "../../packages/orm";

/** 字典类型表 Schema */
export default class DictTypeSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement();
  /** 字典名称 */
  name = column.string().default("");
  /** 字典类型 (唯一标识) */
  type = column.string().unique().default("");
  /** 状态: 0-禁用 1-启用 */
  status = DictTypeSchema.status(1);
  /** 备注 */
  remark = column.string().nullable().default(null);
}
