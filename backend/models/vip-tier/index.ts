import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** VipTier Model */
const VipTier = await db.model({
  tableName: "vip_tier",
  schema,
});

/** VIP 等级行类型 */
export type VipTierRow = InferRow<typeof schema>;
/** VIP 等级插入类型 */
export type VipTierInsert = InsertData<typeof schema>;
/** VIP 等级更新类型 */
export type VipTierUpdate = UpdateData<typeof schema>;

export default VipTier;
export { schema };
