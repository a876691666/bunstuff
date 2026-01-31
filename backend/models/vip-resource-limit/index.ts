import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** VipResourceLimit Model */
const VipResourceLimit = await db.model({
  tableName: "vip_resource_limit",
  schema,
});

/** VIP 资源限制行类型 */
export type VipResourceLimitRow = InferRow<typeof schema>;
/** VIP 资源限制插入类型 */
export type VipResourceLimitInsert = InsertData<typeof schema>;
/** VIP 资源限制更新类型 */
export type VipResourceLimitUpdate = UpdateData<typeof schema>;

export default VipResourceLimit;
export { schema };
