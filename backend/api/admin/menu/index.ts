import { Elysia, t } from 'elysia'
import * as menuService from '@/services/menu'
import { idParams, query, tree } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia({ tags: ['管理 - 菜单'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  .get(
    '/',
    async (ctx) => {
      const result = await menuService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(menuService.getSchema(), '菜单列表分页数据') },
      detail: {
        summary: '获取菜单列表',
        description: '分页获取菜单列表\n\n🔐 **所需权限**: `menu:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:list'] } },
      },
    },
  )

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
        description: '获取菜单的树形结构\n\n🔐 **所需权限**: `menu:admin:tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:tree'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await menuService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('菜单')
      return R.ok(data)
    },
    {
      params: idParams({ label: '菜单ID' }),
      response: {
        200: SuccessResponse(menuService.getSchema(), '菜单详情数据'),
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

  .post(
    '/',
    async (ctx) => {
      const data = await menuService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: menuService.getSchema({ exclude: ['id'], required: ['name', 'path'] }),
      response: { 200: SuccessResponse(menuService.getSchema(), '新创建的菜单信息') },
      detail: {
        summary: '创建菜单',
        description: '创建新菜单\n\n🔐 **所需权限**: `menu:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:create'] } },
        operLog: { title: '菜单管理', type: 'create' },
      },
    },
  )

  .put(
    '/:id',
    async (ctx) => {
      const existing = await menuService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('菜单')
      const data = await menuService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '菜单ID' }),
      body: menuService.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(menuService.getSchema(), '更新后的菜单信息'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新菜单',
        description: '更新指定菜单的信息\n\n🔐 **所需权限**: `menu:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:update'] } },
        operLog: { title: '菜单管理', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const existing = await menuService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('菜单')
      await menuService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '菜单ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除菜单',
        description: '删除指定菜单\n\n🔐 **所需权限**: `menu:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['menu:admin:delete'] } },
        operLog: { title: '菜单管理', type: 'delete' },
      },
    },
  )
