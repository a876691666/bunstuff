import { TimestampSchema, column } from "../../packages/orm";

/** 系统参数配置表 Schema */
export default class SysConfigSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement();
  /** 参数名称 */
  name = column.string().default("");
  /** 参数键名 (唯一标识) */
  key = column.string().unique().default("");
  /** 参数键值 */
  value = column.string().default("");
  /** 系统内置: 0-否 1-是 (内置参数不可删除) */
  isBuiltin = column.number().default(0);
  /** 备注 */
  remark = column.string().nullable().default(null);
}
