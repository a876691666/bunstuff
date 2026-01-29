import { where } from "../packages/ssql";
import Role from "./role";

// await Role.create({
//   parentId: null,
//   name: "tester",
//   code: "tester",
//   status: 1,
//   sort: 0,
//   description: "测试数据",
// });

// 或使用 SSQL 字符串
Role.findMany({
  where: where().eq("name", "tester"),
}).then((ress) => {
  console.log(ress);
});
