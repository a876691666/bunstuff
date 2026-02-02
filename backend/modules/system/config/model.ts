import { t } from 'elysia'

// ============ 参数配置模型 ============

/** 参数配置信息模型 */
export const SysConfigSchema = t.Object({
  id: t.Number({ description: 'ID' }),
  name: t.String({ description: '参数名称' }),
  key: t.String({ description: '参数键名' }),
  value: t.String({ description: '参数键值' }),
  isBuiltin: t.Number({ description: '系统内置：1是 0否' }),
  remark: t.Nullable(t.String({ description: '备注' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 创建参数配置请求 */
export const createSysConfigBody = t.Object({
  name: t.String({ description: '参数名称', minLength: 1, maxLength: 100 }),
  key: t.String({ description: '参数键名（唯一）', minLength: 1, maxLength: 100 }),
  value: t.String({ description: '参数键值', maxLength: 500 }),
  isBuiltin: t.Optional(t.Number({ description: '系统内置', default: 0 })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 更新参数配置请求 */
export const updateSysConfigBody = t.Object({
  name: t.Optional(t.String({ description: '参数名称', minLength: 1, maxLength: 100 })),
  key: t.Optional(t.String({ description: '参数键名', minLength: 1, maxLength: 100 })),
  value: t.Optional(t.String({ description: '参数键值', maxLength: 500 })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 参数配置ID参数 */
export const sysConfigIdParams = t.Object({
  id: t.Numeric({ description: '参数配置ID' }),
})

/** 参数配置查询参数 */
export const sysConfigQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
  filter: t.Optional(t.String({ description: 'SSQL过滤条件' })),
})

/** 参数键名路径参数 */
export const sysConfigKeyParams = t.Object({
  key: t.String({ description: '参数键名' }),
})
