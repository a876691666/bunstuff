import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** RolePermission Model - 角色权限关联 */
const RolePermission = await db.model({
  tableName: "role_permission",
  schema,
});

/** 角色权限关联行类型 */
export type RolePermissionRow = InferRow<typeof schema>;
/** 角色权限关联插入类型 */
export type RolePermissionInsert = InsertData<typeof schema>;
/** 角色权限关联更新类型 */
export type RolePermissionUpdate = UpdateData<typeof schema>;

export default RolePermission;
export { schema };
