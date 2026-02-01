import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** UserResourceUsage Model */
const UserResourceUsage = await db.model({
  tableName: "user_resource_usage",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 用户资源使用行类型 */
export type UserResourceUsageRow = InferRow<SchemaType>;
/** 用户资源使用插入类型 */
export type UserResourceUsageInsert = InsertData<SchemaType>;
/** 用户资源使用更新类型 */
export type UserResourceUsageUpdate = UpdateData<SchemaType>;

export default UserResourceUsage;
export { Schema };
