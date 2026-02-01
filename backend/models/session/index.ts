import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** Session Model */
const Session = await db.model({
  tableName: "session",
  schema,
});

/** 会话行类型 */
export type SessionRow = InferRow<typeof schema>;
/** 会话插入类型 */
export type SessionInsert = InsertData<typeof schema>;
/** 会话更新类型 */
export type SessionUpdate = UpdateData<typeof schema>;

export default Session;
export { schema };
