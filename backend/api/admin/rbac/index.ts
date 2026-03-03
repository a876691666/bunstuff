import { Elysia, t } from 'elysia'
import * as rbacService from '@/services/rbac'
import * as rbacCache from '@/services/rbac-cache'
import { R, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'

/** RBAC 管理模块控制器（管理端） - Casbin 版 */
export default new Elysia({ tags: ['管理 - RBAC权限'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())

  // ============ 角色相关 ============

  .get(
    '/roles',
    async (ctx) => {
      const data = rbacService.getAllRoles()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '角色ID' }),
              name: t.String({ description: '角色名称' }),
              code: t.String({ description: '角色编码' }),
              status: t.Number({ description: '状态' }),
              sort: t.Number({ description: '排序' }),
              description: t.Nullable(t.String({ description: '描述' })),
            }),
          ),
          '角色列表',
        ),
      },
      detail: {
        summary: '获取角色列表',
        description: '获取所有角色（扁平列表，无继承）\n\n🔐 **所需权限**: `rbac:admin:roles-tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:roles-tree'] } },
      },
    },
  )

  // ============ 角色权限相关 ============

  .get(
    '/roles/:roleId/permissions',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const codes = await rbacService.getRolePermissionCodes(role.code)
      return R.ok(codes)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(t.String({ description: '权限编码' })),
          '角色权限编码列表',
        ),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色权限列表',
        description:
          '获取角色的所有权限编码\n\n🔐 **所需权限**: `rbac:admin:role-permissions`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-permissions'] } },
      },
    },
  )

  .post(
    '/roles/:roleId/permissions/check',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const hasPermission = await rbacService.hasPermission(role.code, ctx.body.permissionCode)
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
        404: ErrorResponse,
      },
      detail: {
        summary: '检查角色权限',
        description:
          '检查角色是否拥有指定权限\n\n🔐 **所需权限**: `rbac:admin:permission-check`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:permission-check'] } },
      },
    },
  )

  .post(
    '/roles/:roleId/permissions/check-any',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const hasPermission = await rbacService.hasAnyPermission(role.code, ctx.body.permissionCodes)
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
          '检查角色是否拥有任意一个权限\n\n🔐 **所需权限**: `rbac:admin:permission-check-any`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:permission-check-any'] } },
      },
    },
  )

  .post(
    '/roles/:roleId/permissions/check-all',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const hasPermission = await rbacService.hasAllPermissions(role.code, ctx.body.permissionCodes)
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
          '检查角色是否同时拥有所有权限\n\n🔐 **所需权限**: `rbac:admin:permission-check-all`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:permission-check-all'] } },
      },
    },
  )

  // ============ 角色菜单相关 ============

  .get(
    '/roles/:roleId/menus',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const data = await rbacService.getRoleMenus(role.code)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(t.Array(t.Any()), '角色菜单平铺列表'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色菜单列表',
        description:
          '获取角色的所有菜单\n\n🔐 **所需权限**: `rbac:admin:role-menus`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-menus'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/menus/tree',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const data = await rbacService.getRoleMenuTree(role.code)
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
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色菜单树',
        description:
          '获取角色菜单树形结构\n\n🔐 **所需权限**: `rbac:admin:role-menus-tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-menus-tree'] } },
      },
    },
  )

  // ============ 角色数据权限相关 ============

  .get(
    '/roles/:roleId/scopes',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const scopes = await rbacService.getRoleScopes(role.code)
      return R.ok(scopes)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(t.Object({
            table: t.String({ description: '表名' }),
            permission: t.String({ description: '权限编码' }),
            rule: t.String({ description: 'SSQL规则表达式' }),
          })),
          '角色数据权限规则列表',
        ),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色数据权限',
        description:
          '获取角色的所有数据过滤规则（SSQL），按表名分组\n\n🔐 **所需权限**: `rbac:admin:role-scopes`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:role-scopes'] } },
      },
    },
  )

  .get(
    '/roles/:roleId/scopes/ssql',
    async (ctx) => {
      const role = rbacCache.getRole(ctx.params.roleId)
      if (!role) return R.notFound('角色')
      const data = await rbacService.getRoleSsqlRules(role.code, ctx.query.tableName)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      query: t.Object({ tableName: t.String({ description: '目标表名' }) }),
      response: {
        200: SuccessResponse(t.Array(t.String({ description: 'SSQL规则表达式' })), 'SSQL规则列表'),
        404: ErrorResponse,
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
      return R.ok(info)
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户ID' }) }),
      response: {
        200: SuccessResponse(
          t.Object({
            userId: t.Number({ description: '用户ID' }),
            permissionCodes: t.Array(t.String()),
            menus: t.Array(t.Any()),
            scopes: t.Array(t.Object({
              table: t.String({ description: '表名' }),
              permission: t.String({ description: '权限编码' }),
              rule: t.String({ description: 'SSQL规则' }),
            })),
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
          '检查用户是否拥有指定权限\n\n🔐 **所需权限**: `rbac:admin:user-permission-check`',
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
          '检查用户是否拥有任意一个权限\n\n🔐 **所需权限**: `rbac:admin:user-permission-check-any`',
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
          t.Array(t.String({ description: 'SSQL规则表达式' })),
          '用户表数据权限SSQL规则',
        ),
      },
      detail: {
        summary: '获取用户表数据权限',
        description:
          '获取用户对指定表的SSQL过滤规则\n\n🔐 **所需权限**: `rbac:admin:user-scopes-table`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:user-scopes-table'] } },
      },
    },
  )

  // ============ Casbin 缓存管理 ============

  .get(
    '/cache/status',
    async (ctx) => {
      const data = await rbacService.getCacheStatus()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Object({
            initialized: t.Boolean({ description: '是否已初始化' }),
            roleCount: t.Number({ description: '角色缓存数量' }),
            localMenuCount: t.Number({ description: '菜单缓存数量' }),
            policyCount: t.Number({ description: 'Casbin策略总数' }),
            permCount: t.Number({ description: '权限策略数量' }),
            scopeCount: t.Number({ description: '数据域策略数量' }),
            moduleCount: t.Number({ description: '策略模块数量' }),
            permissionDefCount: t.Number({ description: '权限定义总数' }),
            lastUpdated: t.String({ description: '最后更新时间' }),
          }),
          'RBAC缓存状态信息',
        ),
      },
      detail: {
        summary: '获取缓存状态',
        description: '获取RBAC/Casbin缓存的当前状态\n\n🔐 **所需权限**: `rbac:admin:cache-status`',
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
        description: '手动刷新RBAC/Casbin缓存\n\n🔐 **所需权限**: `rbac:admin:cache-reload`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rbac:admin:cache-reload'] } },
      },
    },
  )
