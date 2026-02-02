import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** LoginLog Model - 登录日志 */
const LoginLog = await db.model({
  tableName: "login_log",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 登录日志行类型 */
export type LoginLogRow = InferRow<SchemaType>;
/** 登录日志插入类型 */
export type LoginLogInsert = InsertData<SchemaType>;
/** 登录日志更新类型 */
export type LoginLogUpdate = UpdateData<SchemaType>;

export default LoginLog;
export { Schema };
