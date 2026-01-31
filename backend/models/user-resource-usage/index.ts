import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** UserResourceUsage Model */
const UserResourceUsage = await db.model({
  tableName: "user_resource_usage",
  schema,
});

/** 用户资源使用行类型 */
export type UserResourceUsageRow = InferRow<typeof schema>;
/** 用户资源使用插入类型 */
export type UserResourceUsageInsert = InsertData<typeof schema>;
/** 用户资源使用更新类型 */
export type UserResourceUsageUpdate = UpdateData<typeof schema>;

export default UserResourceUsage;
export { schema };
