import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** SysFile Model - 文件元数据 */
const SysFile = await db.model({
  tableName: "sys_file",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 文件元数据行类型 */
export type SysFileRow = InferRow<SchemaType>;
/** 文件元数据插入类型 */
export type SysFileInsert = InsertData<SchemaType>;
/** 文件元数据更新类型 */
export type SysFileUpdate = UpdateData<SchemaType>;

export default SysFile;
export { Schema };
