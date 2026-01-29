import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** Permission Model */
const Permission = await db.model({
  tableName: "permission",
  schema,
});

/** 权限行类型 */
export type PermissionRow = InferRow<typeof schema>;
/** 权限插入类型 */
export type PermissionInsert = InsertData<typeof schema>;
/** 权限更新类型 */
export type PermissionUpdate = UpdateData<typeof schema>;

export default Permission;
export { schema };
