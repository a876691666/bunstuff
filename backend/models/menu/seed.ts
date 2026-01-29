import type { SeedDefinition } from "../../modules/seed/service";
import Menu from "./index";

/** 默认菜单数据 */
const defaultMenus = [
  // 系统管理目录
  {
    parentId: null,
    name: "系统管理",
    path: "/system",
    component: null,
    icon: "setting",
    type: 1, // 目录
    visible: 1,
    status: 1,
    redirect: "/system/user",
    sort: 0,
    permCode: null,
  },
  // 用户管理页面
  {
    parentId: 1,
    name: "用户管理",
    path: "/system/user",
    component: "system/user/index",
    icon: "user",
    type: 2, // 页面
    visible: 1,
    status: 1,
    redirect: null,
    sort: 0,
    permCode: "user:list",
  },
  // 角色管理页面
  {
    parentId: 1,
    name: "角色管理",
    path: "/system/role",
    component: "system/role/index",
    icon: "peoples",
    type: 2,
    visible: 1,
    status: 1,
    redirect: null,
    sort: 1,
    permCode: "role:list",
  },
  // 权限管理页面
  {
    parentId: 1,
    name: "权限管理",
    path: "/system/permission",
    component: "system/permission/index",
    icon: "lock",
    type: 2,
    visible: 1,
    status: 1,
    redirect: null,
    sort: 2,
    permCode: "permission:list",
  },
  // 菜单管理页面
  {
    parentId: 1,
    name: "菜单管理",
    path: "/system/menu",
    component: "system/menu/index",
    icon: "menu",
    type: 2,
    visible: 1,
    status: 1,
    redirect: null,
    sort: 3,
    permCode: "menu:list",
  },
  // 数据权限页面
  {
    parentId: 1,
    name: "数据权限",
    path: "/system/permission-scope",
    component: "system/permission-scope/index",
    icon: "database",
    type: 2,
    visible: 1,
    status: 1,
    redirect: null,
    sort: 4,
    permCode: "permission-scope:list",
  },
];

/** 菜单表 Seed */
export const menuSeed: SeedDefinition = {
  name: "menu-default",
  description: "初始化默认菜单数据",
  async run() {
    for (const menu of defaultMenus) {
      await Menu.create(menu);
    }
    console.log(`✅ 已创建 ${defaultMenus.length} 个默认菜单`);
  },
};

export default menuSeed;
