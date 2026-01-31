import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** UserVip Model */
const UserVip = await db.model({
  tableName: "user_vip",
  schema,
});

/** 用户 VIP 行类型 */
export type UserVipRow = InferRow<typeof schema>;
/** 用户 VIP 插入类型 */
export type UserVipInsert = InsertData<typeof schema>;
/** 用户 VIP 更新类型 */
export type UserVipUpdate = UpdateData<typeof schema>;

export default UserVip;
export { schema };
