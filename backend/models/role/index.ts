import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** Role Model */
const Role = await db.model({
  tableName: "role",
  schema,
});

/** 角色行类型 */
export type RoleRow = InferRow<typeof schema>;
/** 角色插入类型 */
export type RoleInsert = InsertData<typeof schema>;
/** 角色更新类型 */
export type RoleUpdate = UpdateData<typeof schema>;

export default Role;
export { schema };
