import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 菜单表 Schema (树形结构) */
const schema = {
  /** 菜单 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 父菜单ID (用于目录-页面两级结构) */
  parentId: column.number().nullable(),
  /** 菜单名称 */
  name: column.string(),
  /** 路由路径 */
  path: column.string(),
  /** 组件路径 */
  component: column.string().nullable(),
  /** 图标 */
  icon: column.string().nullable(),
  /** 菜单类型: 1-目录 2-菜单 3-按钮 */
  type: column.number().default(2),
  /** 是否可见: 0-隐藏 1-显示 */
  visible: column.number().default(1),
  /** 状态: 0-禁用 1-启用 */
  status: column.number().default(1),
  /** 重定向地址 */
  redirect: column.string().nullable(),
  /** 排序 */
  sort: column.number().default(0),
  /** 权限编码 (关联Permission.code) */
  permCode: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
