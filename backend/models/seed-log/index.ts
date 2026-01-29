import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** SeedLog Model - Seed执行日志 */
const SeedLog = await db.model({
  tableName: "seed_log",
  schema,
});

/** Seed日志行类型 */
export type SeedLogRow = InferRow<typeof schema>;
/** Seed日志插入类型 */
export type SeedLogInsert = InsertData<typeof schema>;
/** Seed日志更新类型 */
export type SeedLogUpdate = UpdateData<typeof schema>;

export default SeedLog;
export { schema };
