import type { InferRow, InsertData, UpdateData } from "../../packages/orm";
import { db } from "../main";
import schema from "./schema";

/** User Model */
const User = await db.model({
  tableName: "users",
  schema,
  format: {
    password: {
      // 反序列化：写入数据库前对密码进行哈希
      deserialize: (v) => Bun.password.hash(v),
      // 序列化：从数据库读取后不做处理（也可以在这里做脱敏处理）
      // serialize: (v) => v,
    },
  },
});

/** 用户行类型 */
export type UserRow = InferRow<typeof schema>;
/** 用户插入类型 */
export type UserInsert = InsertData<typeof schema>;
/** 用户更新类型 */
export type UserUpdate = UpdateData<typeof schema>;

export default User;
export { schema };
