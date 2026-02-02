import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** Notice Model - 通知公告 */
const Notice = await db.model({
  tableName: "notice",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 通知公告行类型 */
export type NoticeRow = InferRow<SchemaType>;
/** 通知公告插入类型 */
export type NoticeInsert = InsertData<SchemaType>;
/** 通知公告更新类型 */
export type NoticeUpdate = UpdateData<SchemaType>;

export default Notice;
export { Schema };
