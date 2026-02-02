import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import Schema from "./schema";

/** DictType Model - 字典类型 */
const DictType = await db.model({
  tableName: "dict_type",
  schema: Schema,
});

type SchemaType = ReturnType<typeof Schema.getDefinition>;

/** 字典类型行类型 */
export type DictTypeRow = InferRow<SchemaType>;
/** 字典类型插入类型 */
export type DictTypeInsert = InsertData<SchemaType>;
/** 字典类型更新类型 */
export type DictTypeUpdate = UpdateData<SchemaType>;

export default DictType;
export { Schema };
