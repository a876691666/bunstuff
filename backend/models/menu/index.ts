import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** Menu Model - 菜单 */
const Menu = await db.model({
  tableName: "menu",
  schema,
});

/** 菜单行类型 */
export type MenuRow = InferRow<typeof schema>;
/** 菜单插入类型 */
export type MenuInsert = InsertData<typeof schema>;
/** 菜单更新类型 */
export type MenuUpdate = UpdateData<typeof schema>;

export default Menu;
export { schema };
