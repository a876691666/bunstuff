import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** Permission Model */
const Permission = await db.model({
  tableName: "permission",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 权限行类型 */
export type PermissionRow = InferRow<SchemaType>;
/** 权限插入类型 */
export type PermissionInsert = InsertData<SchemaType>;
/** 权限更新类型 */
export type PermissionUpdate = UpdateData<SchemaType>;

export default Permission;
export { Schema };
