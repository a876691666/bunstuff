import { t } from 'elysia'

// ============ 字典类型模型 ============

/** 字典类型信息模型 */
export const DictTypeSchema = t.Object({
  id: t.Number({ description: 'ID' }),
  name: t.String({ description: '字典名称' }),
  type: t.String({ description: '字典类型' }),
  status: t.Number({ description: '状态：1启用 0禁用' }),
  remark: t.Nullable(t.String({ description: '备注' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 创建字典类型请求 */
export const createDictTypeBody = t.Object({
  name: t.String({ description: '字典名称', minLength: 1, maxLength: 100 }),
  type: t.String({ description: '字典类型（唯一）', minLength: 1, maxLength: 100 }),
  status: t.Optional(t.Number({ description: '状态', default: 1 })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 更新字典类型请求 */
export const updateDictTypeBody = t.Object({
  name: t.Optional(t.String({ description: '字典名称', minLength: 1, maxLength: 100 })),
  type: t.Optional(t.String({ description: '字典类型', minLength: 1, maxLength: 100 })),
  status: t.Optional(t.Number({ description: '状态' })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 字典类型ID参数 */
export const dictTypeIdParams = t.Object({
  id: t.Numeric({ description: '字典类型ID' }),
})

/** 字典类型查询参数 */
export const dictTypeQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
  name: t.Optional(t.String({ description: '字典名称' })),
  type: t.Optional(t.String({ description: '字典类型' })),
  status: t.Optional(t.Numeric({ description: '状态' })),
})

// ============ 字典数据模型 ============

/** 字典数据信息模型 */
export const DictDataSchema = t.Object({
  id: t.Number({ description: 'ID' }),
  dictType: t.String({ description: '字典类型' }),
  label: t.String({ description: '字典标签' }),
  value: t.String({ description: '字典键值' }),
  cssClass: t.Nullable(t.String({ description: '样式属性' })),
  listClass: t.Nullable(t.String({ description: '表格回显样式' })),
  sort: t.Number({ description: '排序' }),
  status: t.Number({ description: '状态：1启用 0禁用' }),
  isDefault: t.Number({ description: '是否默认：1是 0否' }),
  remark: t.Nullable(t.String({ description: '备注' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 创建字典数据请求 */
export const createDictDataBody = t.Object({
  dictType: t.String({ description: '字典类型', minLength: 1, maxLength: 100 }),
  label: t.String({ description: '字典标签', minLength: 1, maxLength: 100 }),
  value: t.String({ description: '字典键值', minLength: 1, maxLength: 100 }),
  cssClass: t.Optional(t.Nullable(t.String({ description: '样式属性', maxLength: 100 }))),
  listClass: t.Optional(t.Nullable(t.String({ description: '表格回显样式', maxLength: 100 }))),
  sort: t.Optional(t.Number({ description: '排序', default: 0 })),
  status: t.Optional(t.Number({ description: '状态', default: 1 })),
  isDefault: t.Optional(t.Number({ description: '是否默认', default: 0 })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 更新字典数据请求 */
export const updateDictDataBody = t.Object({
  dictType: t.Optional(t.String({ description: '字典类型', minLength: 1, maxLength: 100 })),
  label: t.Optional(t.String({ description: '字典标签', minLength: 1, maxLength: 100 })),
  value: t.Optional(t.String({ description: '字典键值', minLength: 1, maxLength: 100 })),
  cssClass: t.Optional(t.Nullable(t.String({ description: '样式属性', maxLength: 100 }))),
  listClass: t.Optional(t.Nullable(t.String({ description: '表格回显样式', maxLength: 100 }))),
  sort: t.Optional(t.Number({ description: '排序' })),
  status: t.Optional(t.Number({ description: '状态' })),
  isDefault: t.Optional(t.Number({ description: '是否默认' })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 字典数据ID参数 */
export const dictDataIdParams = t.Object({
  id: t.Numeric({ description: '字典数据ID' }),
})

/** 字典数据查询参数 */
export const dictDataQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
  dictType: t.Optional(t.String({ description: '字典类型' })),
  label: t.Optional(t.String({ description: '字典标签' })),
  status: t.Optional(t.Numeric({ description: '状态' })),
})

/** 字典类型路径参数 */
export const dictTypeParams = t.Object({
  dictType: t.String({ description: '字典类型' }),
})
