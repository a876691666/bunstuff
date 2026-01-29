import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** PermissionScope Model - 数据过滤规则 */
const PermissionScope = await db.model({
  tableName: "permission_scope",
  schema,
});

/** 数据过滤规则行类型 */
export type PermissionScopeRow = InferRow<typeof schema>;
/** 数据过滤规则插入类型 */
export type PermissionScopeInsert = InsertData<typeof schema>;
/** 数据过滤规则更新类型 */
export type PermissionScopeUpdate = UpdateData<typeof schema>;

export default PermissionScope;
export { schema };
