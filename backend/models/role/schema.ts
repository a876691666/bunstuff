import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 角色表 Schema (树形结构) */
const schema = {
  /** 角色 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 父角色ID (自引用，用于树形结构) */
  parentId: column.number().nullable(),
  /** 角色名称 */
  name: column.string(),
  /** 角色编码 */
  code: column.string().unique(),
  /** 状态: 0-禁用 1-启用 */
  status: column.number().default(1),
  /** 排序 */
  sort: column.number().default(0),
  /** 角色描述 */
  description: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
