import { t } from 'elysia'

// ============ 菜单数据模型 ============

/** 菜单信息模型（响应用） */
export const MenuSchema = t.Object({
  id: t.Number({ description: '菜单ID' }),
  parentId: t.Nullable(t.Number({ description: '父菜单ID' })),
  name: t.String({ description: '菜单名称' }),
  path: t.String({ description: '路由路径' }),
  component: t.Nullable(t.String({ description: '组件路径' })),
  icon: t.Nullable(t.String({ description: '菜单图标' })),
  type: t.Number({ description: '菜单类型：1目录 2菜单 3按钮' }),
  visible: t.Number({ description: '是否可见：1可见 0隐藏' }),
  status: t.Number({ description: '状态：1启用 0禁用' }),
  redirect: t.Nullable(t.String({ description: '重定向地址' })),
  sort: t.Number({ description: '排序值' }),
  permCode: t.Nullable(t.String({ description: '权限标识码' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 菜单树节点模型 */
export const MenuTreeSchema = t.Recursive(
  (Self) =>
    t.Object({
      id: t.Number({ description: '菜单ID' }),
      parentId: t.Nullable(t.Number({ description: '父菜单ID' })),
      name: t.String({ description: '菜单名称' }),
      path: t.String({ description: '路由路径' }),
      component: t.Nullable(t.String({ description: '组件路径' })),
      icon: t.Nullable(t.String({ description: '菜单图标' })),
      type: t.Number({ description: '菜单类型：1目录 2菜单 3按钮' }),
      visible: t.Number({ description: '是否可见：1可见 0隐藏' }),
      status: t.Optional(t.Number({ description: '状态：1启用 0禁用' })),
      redirect: t.Optional(t.Nullable(t.String({ description: '重定向地址' }))),
      sort: t.Number({ description: '排序值' }),
      permCode: t.Optional(t.Nullable(t.String({ description: '权限标识码' }))),
      children: t.Optional(t.Array(Self, { description: '子菜单列表' })),
    }),
  { description: '菜单树节点' },
)

/** 菜单创建请求模型 */
export const createMenuBody = t.Object(
  {
    parentId: t.Optional(t.Nullable(t.Number({ description: '父菜单ID，为空表示顶级菜单' }))),
    name: t.String({ description: '菜单名称', minLength: 1, maxLength: 50 }),
    path: t.String({ description: '路由路径', minLength: 1, maxLength: 200 }),
    component: t.Optional(t.Nullable(t.String({ description: '组件路径', maxLength: 200 }))),
    icon: t.Optional(t.Nullable(t.String({ description: '菜单图标', maxLength: 50 }))),
    type: t.Optional(t.Number({ description: '菜单类型：1目录 2菜单 3按钮', default: 2 })),
    visible: t.Optional(t.Number({ description: '是否可见：1可见 0隐藏', default: 1 })),
    status: t.Optional(t.Number({ description: '状态：1启用 0禁用', default: 1 })),
    redirect: t.Optional(t.Nullable(t.String({ description: '重定向地址', maxLength: 200 }))),
    sort: t.Optional(t.Number({ description: '排序值，越小越靠前', default: 0 })),
    permCode: t.Optional(t.Nullable(t.String({ description: '权限标识码', maxLength: 100 }))),
  },
  { description: '创建菜单请求体' },
)

/** 菜单更新请求模型 */
export const updateMenuBody = t.Object(
  {
    parentId: t.Optional(t.Nullable(t.Number({ description: '父菜单ID' }))),
    name: t.Optional(t.String({ description: '菜单名称', minLength: 1, maxLength: 50 })),
    path: t.Optional(t.String({ description: '路由路径', minLength: 1, maxLength: 200 })),
    component: t.Optional(t.Nullable(t.String({ description: '组件路径', maxLength: 200 }))),
    icon: t.Optional(t.Nullable(t.String({ description: '菜单图标', maxLength: 50 }))),
    type: t.Optional(t.Number({ description: '菜单类型：1目录 2菜单 3按钮' })),
    visible: t.Optional(t.Number({ description: '是否可见：1可见 0隐藏' })),
    status: t.Optional(t.Number({ description: '状态：1启用 0禁用' })),
    redirect: t.Optional(t.Nullable(t.String({ description: '重定向地址', maxLength: 200 }))),
    sort: t.Optional(t.Number({ description: '排序值' })),
    permCode: t.Optional(t.Nullable(t.String({ description: '权限标识码', maxLength: 100 }))),
  },
  { description: '更新菜单请求体' },
)

/** 菜单ID参数模型 */
export const menuIdParams = t.Object(
  {
    id: t.Numeric({ description: '菜单ID' }),
  },
  { description: '菜单ID路径参数' },
)

/** 菜单查询参数模型 */
export const menuQueryParams = t.Object(
  {
    page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
    pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
    filter: t.Optional(t.String({ description: 'SSQL过滤条件' })),
  },
  { description: '菜单列表查询参数' },
)
