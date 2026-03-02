import { Elysia, t } from 'elysia'
import * as rbacService from '@/services/rbac'
import { R, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'

/** RBAC 管理模块控制器（管理端） */
export default new Elysia({ tags: ['管理 - RBAC权限'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())

  // ============ 角色相关 ============

  .get(
    '/roles/tree',
    async (ctx) => {
      const data = await rbacService.getRoleTree()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            t.Recursive((Self) =>
              t.Object({
                id: t.Number({ description: '角色ID' }),
                name: t.String({ description: '角色名称' }),
                code: t.String({ description: '角色编码' }),
                parentId: t.Nullable(t.Number({ description: '父角色ID' })),
                permissions: t.Array(t.String({ description: '权限编码' })),
                children: t.Optional(t.Array(Self)),
              }),
            ),
          ),
          '角色权限树结构',
        ),
      },
      detail: {
        summary: '获取角色树',
        description:
          '获取角色的树形结构，每个节点包含汇聚的权限信息\n\n🔐 **所需权限**: `rbac:admin:roles-tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:roles-tree'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/chain',
    async (ctx) => {
      const data = await rbacService.getRoleChain(ctx.params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '角色ID' }),
              name: t.String({ description: '角色名称' }),
              code: t.String({ description: '角色编码' }),
              parentId: t.Nullable(t.Number({ description: '父角色ID' })),
            }),
          ),
          '从当前角色到根角色的链路',
        ),
      },
      detail: {
        summary: '获取角色父级链',
        description:
          '获取从当前角色到根角色的完整继承链路\n\n🔐 **所需权限**: `rbac:admin:role-chain`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-chain'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/children',
    async (ctx) => {
      const data = await rbacService.getChildRoleIds(ctx.params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(t.Array(t.Number({ description: '子角色ID' })), '所有后代角色ID列表'),
      },
      detail: {
        summary: '获取子角色ID列表',
        description:
          '获取角色的所有后代角色ID（递归查询）\n\n🔐 **所需权限**: `rbac:admin:role-children`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-children'] } },
      },
    },
  )

  // ============ 角色权限相关 ============

  .get(
    '/roles/:roleId/permissions',
    async (ctx) => {
      const data = await rbacService.getRolePermissions(ctx.params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '权限ID' }),
              name: t.String({ description: '权限名称' }),
              code: t.String({ description: '权限编码' }),
              resource: t.Nullable(t.String({ description: '资源标识' })),
            }),
          ),
          '角色权限列表（含继承）',
        ),
      },
      detail: {
        summary: '获取角色权限列表',
        description:
          '获取角色的所有权限，包含从子角色汇聚的权限\n\n🔐 **所需权限**: `rbac:admin:role-permissions`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-permissions'] } },
      },
    },
  )

  .post(
    '/roles/:roleId/permissions/check',
    async (ctx) => {
      const hasPermission = await rbacService.hasPermission(
        ctx.params.roleId,
        ctx.body.permissionCode,
      )
      return R.ok({ hasPermission })
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      body: t.Object({ permissionCode: t.String({ description: '要检查的权限编码' }) }),
      response: {
        200: SuccessResponse(
          t.Object({ hasPermission: t.Boolean({ description: '是否拥有权限' }) }),
          '权限检查结果',
        ),
      },
      detail: {
        summary: '检查角色权限',
        description:
          '检查角色是否拥有指定的单个权限\n\n🔐 **所需权限**: `rbac:admin:permission-check`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:permission-check'] } },
      },
    },
  )

  .post(
    '/roles/:roleId/permissions/check-any',
    async (ctx) => {
      const hasPermission = await rbacService.hasAnyPermission(
        ctx.params.roleId,
        ctx.body.permissionCodes,
      )
      return R.ok({ hasPermission })
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      body: t.Object({ permissionCodes: t.Array(t.String({ description: '权限编码' })) }),
      response: {
        200: SuccessResponse(
          t.Object({ hasPermission: t.Boolean({ description: '是否拥有权限' }) }),
          '权限检查结果',
        ),
      },
      detail: {
        summary: '检查任一权限',
        description:
          '检查角色是否拥有给定权限列表中的任意一个\n\n🔐 **所需权限**: `rbac:admin:permission-check-any`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:permission-check-any'] } },
      },
    },
  )

  .post(
    '/roles/:roleId/permissions/check-all',
    async (ctx) => {
      const hasPermission = await rbacService.hasAllPermissions(
        ctx.params.roleId,
        ctx.body.permissionCodes,
      )
      return R.ok({ hasPermission })
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      body: t.Object({ permissionCodes: t.Array(t.String({ description: '权限编码' })) }),
      response: {
        200: SuccessResponse(
          t.Object({ hasPermission: t.Boolean({ description: '是否拥有权限' }) }),
          '权限检查结果',
        ),
      },
      detail: {
        summary: '检查所有权限',
        description:
          '检查角色是否同时拥有给定的所有权限\n\n🔐 **所需权限**: `rbac:admin:permission-check-all`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:permission-check-all'] } },
      },
    },
  )

  // ============ 角色菜单相关 ============

  .get(
    '/roles/:roleId/menus',
    async (ctx) => {
      const data = await rbacService.getRoleMenus(ctx.params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: { 200: SuccessResponse(t.Array(t.Any()), '角色菜单平铺列表') },
      detail: {
        summary: '获取角色菜单列表',
        description:
          '获取角色的所有菜单（包含从子角色汇聚的菜单）\n\n🔐 **所需权限**: `rbac:admin:role-menus`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-menus'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/menus/tree',
    async (ctx) => {
      const data = await rbacService.getRoleMenuTree(ctx.params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Recursive((Self) =>
              t.Object({
                id: t.Number({ description: '菜单ID' }),
                name: t.String({ description: '菜单名称' }),
                path: t.Nullable(t.String({ description: '路由路径' })),
                component: t.Nullable(t.String({ description: '组件路径' })),
                icon: t.Nullable(t.String({ description: '图标' })),
                sort: t.Number({ description: '排序' }),
                parentId: t.Nullable(t.Number({ description: '父菜单ID' })),
                type: t.Number({ description: '类型：1-目录, 2-菜单, 3-按钮' }),
                visible: t.Number({ description: '是否可见：1-是, 0-否' }),
                permCode: t.Nullable(t.String({ description: '权限标识' })),
                children: t.Optional(t.Array(Self)),
              }),
            ),
          ),
          '角色菜单树结构',
        ),
      },
      detail: {
        summary: '获取角色菜单树',
        description:
          '获取角色的菜单树形结构，用于前端渲染导航\n\n🔐 **所需权限**: `rbac:admin:role-menus-tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-menus-tree'] } },
      },
    },
  )

  // ============ 角色数据权限相关 ============

  .get(
    '/roles/:roleId/scopes',
    async (ctx) => {
      const scopeMap = await rbacService.getRoleScopes(ctx.params.roleId)
      const data: Record<string, any[]> = {}
      for (const [key, value] of scopeMap) {
        data[key] = value
      }
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(
          t.Record(
            t.String(),
            t.Array(
              t.Object({
                id: t.Number({ description: '规则ID' }),
                tableName: t.String({ description: '表名' }),
                ruleName: t.String({ description: '规则名称' }),
                ssql: t.String({ description: 'SSQL表达式' }),
                description: t.Nullable(t.String({ description: '规则描述' })),
              }),
            ),
          ),
          '按表名分组的数据权限规则',
        ),
      },
      detail: {
        summary: '获取角色数据权限',
        description:
          '获取角色的所有数据过滤规则，按表名分组\n\n🔐 **所需权限**: `rbac:admin:role-scopes`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-scopes'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/scopes/table',
    async (ctx) => {
      const data = await rbacService.getRoleScopesForTable(ctx.params.roleId, ctx.query.tableName)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      query: t.Object({ tableName: t.String({ description: '目标表名' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '规则ID' }),
              tableName: t.String({ description: '表名' }),
              ruleName: t.String({ description: '规则名称' }),
              ssql: t.String({ description: 'SSQL表达式' }),
              description: t.Nullable(t.String({ description: '规则描述' })),
            }),
          ),
          '指定表的数据权限规则列表',
        ),
      },
      detail: {
        summary: '获取表数据权限',
        description:
          '获取角色对指定表的数据过滤规则\n\n🔐 **所需权限**: `rbac:admin:role-scopes-table`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-scopes-table'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/scopes/ssql',
    async (ctx) => {
      const data = await rbacService.getRoleSsqlRules(ctx.params.roleId, ctx.query.tableName)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      query: t.Object({ tableName: t.String({ description: '目标表名' }) }),
      response: {
        200: SuccessResponse(t.Array(t.String({ description: 'SSQL规则表达式' })), 'SSQL规则列表'),
      },
      detail: {
        summary: '获取SSQL过滤规则',
        description:
          '获取角色对指定表的SSQL格式过滤规则\n\n🔐 **所需权限**: `rbac:admin:role-scopes-ssql`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-scopes-ssql'] } },
      },
    },
  )

  // ============ 用户相关 ============

  .get(
    '/users/:userId/info',
    async (ctx) => {
      const info = await rbacService.getUserPermissionInfo(ctx.params.userId)
      if (!info) return R.notFound('用户')
      const data = {
        ...info,
        permissionCodes: Array.from(info.permissionCodes),
        scopes: Object.fromEntries(info.scopes),
      }
      return R.ok(data)
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户ID' }) }),
      response: {
        200: SuccessResponse(
          t.Object({
            userId: t.Number({ description: '用户ID' }),
            roleId: t.Number({ description: '角色ID' }),
            roleName: t.String({ description: '角色名称' }),
            roleCode: t.String({ description: '角色编码' }),
            permissionCodes: t.Array(t.String()),
            menus: t.Array(t.Any()),
            scopes: t.Record(t.String(), t.Array(t.Any())),
          }),
          '用户完整权限信息',
        ),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取用户权限信息',
        description: '获取用户的完整权限信息\n\n🔐 **所需权限**: `rbac:admin:user-info`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:user-info'] } },
      },
    },
  )

  .post(
    '/users/:userId/permissions/check',
    async (ctx) => {
      const hasPermission = await rbacService.userHasPermission(
        ctx.params.userId,
        ctx.body.permissionCode,
      )
      return R.ok({ hasPermission })
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户ID' }) }),
      body: t.Object({ permissionCode: t.String({ description: '要检查的权限编码' }) }),
      response: {
        200: SuccessResponse(
          t.Object({ hasPermission: t.Boolean({ description: '是否拥有权限' }) }),
          '权限检查结果',
        ),
      },
      detail: {
        summary: '检查用户权限',
        description:
          '检查用户是否拥有指定的单个权限\n\n🔐 **所需权限**: `rbac:admin:user-permission-check`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:user-permission-check'] } },
      },
    },
  )

  .post(
    '/users/:userId/permissions/check-any',
    async (ctx) => {
      const hasPermission = await rbacService.userHasAnyPermission(
        ctx.params.userId,
        ctx.body.permissionCodes,
      )
      return R.ok({ hasPermission })
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户ID' }) }),
      body: t.Object({ permissionCodes: t.Array(t.String({ description: '权限编码' })) }),
      response: {
        200: SuccessResponse(
          t.Object({ hasPermission: t.Boolean({ description: '是否拥有权限' }) }),
          '权限检查结果',
        ),
      },
      detail: {
        summary: '检查用户任一权限',
        description:
          '检查用户是否拥有给定权限列表中的任意一个\n\n🔐 **所需权限**: `rbac:admin:user-permission-check-any`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:user-permission-check-any'] } },
      },
    },
  )

  .get(
    '/users/:userId/menus/tree',
    async (ctx) => {
      const data = await rbacService.getUserMenuTree(ctx.params.userId)
      return R.ok(data)
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Recursive((Self) =>
              t.Object({
                id: t.Number({ description: '菜单ID' }),
                name: t.String({ description: '菜单名称' }),
                path: t.Nullable(t.String({ description: '路由路径' })),
                component: t.Nullable(t.String({ description: '组件路径' })),
                icon: t.Nullable(t.String({ description: '图标' })),
                sort: t.Number({ description: '排序' }),
                parentId: t.Nullable(t.Number({ description: '父菜单ID' })),
                type: t.Number({ description: '类型：1-目录, 2-菜单, 3-按钮' }),
                visible: t.Number({ description: '是否可见：1-是, 0-否' }),
                permCode: t.Nullable(t.String({ description: '权限标识' })),
                children: t.Optional(t.Array(Self)),
              }),
            ),
          ),
          '用户菜单树结构',
        ),
      },
      detail: {
        summary: '获取用户菜单树',
        description: '获取用户的菜单树形结构\n\n🔐 **所需权限**: `rbac:admin:user-menus-tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:user-menus-tree'] } },
      },
    },
  )

  .get(
    '/users/:userId/scopes/table',
    async (ctx) => {
      const data = await rbacService.getUserScopesForTable(ctx.params.userId, ctx.query.tableName)
      return R.ok(data)
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户ID' }) }),
      query: t.Object({ tableName: t.String({ description: '目标表名' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '规则ID' }),
              tableName: t.String({ description: '表名' }),
              ruleName: t.String({ description: '规则名称' }),
              ssql: t.String({ description: 'SSQL表达式' }),
              description: t.Nullable(t.String({ description: '规则描述' })),
            }),
          ),
          '用户表数据权限规则',
        ),
      },
      detail: {
        summary: '获取用户表数据权限',
        description:
          '获取用户对指定表的数据过滤规则\n\n🔐 **所需权限**: `rbac:admin:user-scopes-table`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:user-scopes-table'] } },
      },
    },
  )

  // ============ 缓存管理 ============

  .get(
    '/cache/status',
    (ctx) => {
      const data = rbacService.getCacheStatus()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Object({
            roleCount: t.Number({ description: '角色缓存数量' }),
            permissionCount: t.Number({ description: '权限缓存数量' }),
            menuCount: t.Number({ description: '菜单缓存数量' }),
            scopeCount: t.Number({ description: '数据权限缓存数量' }),
            lastUpdated: t.String({ description: '最后更新时间' }),
          }),
          'RBAC缓存状态信息',
        ),
      },
      detail: {
        summary: '获取缓存状态',
        description: '获取RBAC缓存的当前状态\n\n🔐 **所需权限**: `rbac:admin:cache-status`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:cache-status'] } },
      },
    },
  )

  .post(
    '/cache/reload',
    async (ctx) => {
      await rbacService.reloadCache()
      return R.success('缓存刷新成功')
    },
    {
      response: { 200: MessageResponse },
      detail: {
        summary: '刷新缓存',
        description: '手动刷新RBAC缓存\n\n🔐 **所需权限**: `rbac:admin:cache-reload`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:cache-reload'] } },
      },
    },
  )
