import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** VipTier Model */
const VipTier = await db.model({
  tableName: "vip_tier",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** VIP 等级行类型 */
export type VipTierRow = InferRow<SchemaType>;
/** VIP 等级插入类型 */
export type VipTierInsert = InsertData<SchemaType>;
/** VIP 等级更新类型 */
export type VipTierUpdate = UpdateData<SchemaType>;

export default VipTier;
export { Schema };
