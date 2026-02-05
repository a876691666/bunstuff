import { Elysia, t } from 'elysia'
import { menuService } from './service'
import { idParams, query, tree } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/modules/response'
import { authPlugin } from '@/modules/auth'
import { rbacPlugin } from '@/modules/rbac'
import { vipPlugin } from '@/modules/vip'
import Menu from '@/models/menu'

/** 菜单管理控制器（管理端） */
export const menuAdminController = new Elysia({ prefix: '/menu', tags: ['管理 - 菜单'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  /** 获取菜单列表 */
  .get(
    '/',
    async ({ query }) => {
      const result = await menuService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(Menu.getSchema(), '菜单列表分页数据'),
      },
      detail: {
        summary: '获取菜单列表',
        description: '分页获取菜单列表，支持按名称、状态、类型筛选\n\n🔐 **所需权限**: `menu:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:list'] } },
      },
    },
  )

  /** 获取菜单树 */
  .get(
    '/tree',
    async () => {
      const data = await menuService.getTree()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            tree({
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
            }),
          ),
          '菜单树形结构数据',
        ),
      },
      detail: {
        summary: '获取菜单树',
        description: '获取菜单的树形结构，包含父子层级关系\n\n🔐 **所需权限**: `menu:admin:tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:tree'] } },
      },
    },
  )

  /** 根据ID获取菜单 */
  .get(
    '/:id',
    async ({ params }) => {
      const data = await menuService.findById(params.id)
      if (!data) return R.notFound('菜单')
      return R.ok(data)
    },
    {
      params: idParams({ label: '菜单ID' }),
      response: {
        200: SuccessResponse(Menu.getSchema(), '菜单详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取菜单详情',
        description: '根据菜单ID获取菜单详细信息\n\n🔐 **所需权限**: `menu:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:read'] } },
      },
    },
  )

  /** 创建菜单 */
  .post(
    '/',
    async ({ body }) => {
      const data = await menuService.create(body)
      return R.ok(data, '创建成功')
    },
    {
      body: Menu.getSchema({ exclude: ['id'], required: ['name', 'path'] }),
      response: {
        200: SuccessResponse(Menu.getSchema(), '新创建的菜单信息'),
      },
      detail: {
        summary: '创建菜单',
        description: '创建新菜单，支持目录、菜单、按钮三种类型\n\n🔐 **所需权限**: `menu:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:create'] } },
      },
    },
  )

  /** 更新菜单 */
  .put(
    '/:id',
    async ({ params, body }) => {
      const existing = await menuService.findById(params.id)
      if (!existing) return R.notFound('菜单')
      const data = await menuService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '菜单ID' }),
      body: Menu.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(Menu.getSchema(), '更新后的菜单信息'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新菜单',
        description: '更新指定菜单的信息，支持部分更新\n\n🔐 **所需权限**: `menu:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:update'] } },
      },
    },
  )

  /** 删除菜单 */
  .delete(
    '/:id',
    async ({ params }) => {
      const existing = await menuService.findById(params.id)
      if (!existing) return R.notFound('菜单')
      await menuService.delete(params.id)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '菜单ID' }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除菜单',
        description: '删除指定菜单，此操作不可恢复\n\n🔐 **所需权限**: `menu:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:delete'] } },
      },
    },
  )

export default menuAdminController
