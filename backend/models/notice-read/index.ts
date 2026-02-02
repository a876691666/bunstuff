import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** NoticeRead Model - 通知已读记录 */
const NoticeRead = await db.model({
  tableName: "notice_read",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 通知已读行类型 */
export type NoticeReadRow = InferRow<SchemaType>;
/** 通知已读插入类型 */
export type NoticeReadInsert = InsertData<SchemaType>;
/** 通知已读更新类型 */
export type NoticeReadUpdate = UpdateData<SchemaType>;

export default NoticeRead;
export { Schema };
