import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** RoleMenu Model - 角色菜单关联 */
const RoleMenu = await db.model({
  tableName: "role_menu",
  schema,
});

/** 角色菜单关联行类型 */
export type RoleMenuRow = InferRow<typeof schema>;
/** 角色菜单关联插入类型 */
export type RoleMenuInsert = InsertData<typeof schema>;
/** 角色菜单关联更新类型 */
export type RoleMenuUpdate = UpdateData<typeof schema>;

export default RoleMenu;
export { schema };
