import { t } from "elysia";

// ============ VIP 等级数据模型 ============

/** VIP 等级信息模型（响应用） */
export const VipTierSchema = t.Object({
  id: t.Number({ description: "VIP 等级 ID" }),
  name: t.String({ description: "VIP 名称" }),
  code: t.String({ description: "VIP 代码" }),
  roleId: t.Nullable(t.Number({ description: "绑定角色 ID" })),
  price: t.Number({ description: "价格" }),
  durationDays: t.Number({ description: "有效期天数" }),
  status: t.Number({ description: "状态：1启用 0禁用" }),
  description: t.Nullable(t.String({ description: "描述" })),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** VIP 等级 ID 参数 */
export const vipTierIdParams = t.Object({
  id: t.Number({ description: "VIP 等级 ID" }),
});

/** VIP 等级查询参数 */
export const vipTierQueryParams = t.Object({
  page: t.Optional(t.Number({ description: "页码", minimum: 1, default: 1 })),
  pageSize: t.Optional(t.Number({ description: "每页数量", minimum: 1, default: 10 })),
  name: t.Optional(t.String({ description: "按名称筛选" })),
  code: t.Optional(t.String({ description: "按代码筛选" })),
  status: t.Optional(t.Number({ description: "按状态筛选" })),
});

/** VIP 等级创建请求模型 */
export const createVipTierBody = t.Object({
  name: t.String({ description: "VIP 名称", minLength: 1, maxLength: 50 }),
  code: t.String({ description: "VIP 代码（唯一）", minLength: 1, maxLength: 50 }),
  roleId: t.Optional(t.Nullable(t.Number({ description: "绑定角色 ID" }))),
  price: t.Optional(t.Number({ description: "价格", default: 0 })),
  durationDays: t.Optional(t.Number({ description: "有效期天数，0表示永久", default: 0 })),
  status: t.Optional(t.Number({ description: "状态：1启用 0禁用", default: 1 })),
  description: t.Optional(t.Nullable(t.String({ description: "描述", maxLength: 255 }))),
}, { description: "创建 VIP 等级请求体" });

/** VIP 等级更新请求模型 */
export const updateVipTierBody = t.Object({
  name: t.Optional(t.String({ description: "VIP 名称", minLength: 1, maxLength: 50 })),
  code: t.Optional(t.String({ description: "VIP 代码", minLength: 1, maxLength: 50 })),
  roleId: t.Optional(t.Nullable(t.Number({ description: "绑定角色 ID" }))),
  price: t.Optional(t.Number({ description: "价格" })),
  durationDays: t.Optional(t.Number({ description: "有效期天数" })),
  status: t.Optional(t.Number({ description: "状态：1启用 0禁用" })),
  description: t.Optional(t.Nullable(t.String({ description: "描述", maxLength: 255 }))),
}, { description: "更新 VIP 等级请求体" });

// ============ VIP 资源限制数据模型 ============

/** VIP 资源限制信息模型（响应用） */
export const VipResourceLimitSchema = t.Object({
  id: t.Number({ description: "ID" }),
  vipTierId: t.Number({ description: "VIP 等级 ID" }),
  resourceKey: t.String({ description: "资源键" }),
  limitValue: t.Number({ description: "限制值，-1表示无限" }),
  description: t.Nullable(t.String({ description: "描述" })),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** VIP 资源限制 ID 参数 */
export const vipResourceLimitIdParams = t.Object({
  id: t.Number({ description: "资源限制 ID" }),
});

/** VIP 资源限制创建请求模型 */
export const createVipResourceLimitBody = t.Object({
  vipTierId: t.Number({ description: "VIP 等级 ID" }),
  resourceKey: t.String({ description: "资源键", minLength: 1, maxLength: 50 }),
  limitValue: t.Number({ description: "限制值，-1表示无限" }),
  description: t.Optional(t.Nullable(t.String({ description: "描述", maxLength: 255 }))),
}, { description: "创建 VIP 资源限制请求体" });

/** VIP 资源限制更新请求模型 */
export const updateVipResourceLimitBody = t.Object({
  resourceKey: t.Optional(t.String({ description: "资源键", minLength: 1, maxLength: 50 })),
  limitValue: t.Optional(t.Number({ description: "限制值，-1表示无限" })),
  description: t.Optional(t.Nullable(t.String({ description: "描述", maxLength: 255 }))),
}, { description: "更新 VIP 资源限制请求体" });

// ============ 用户 VIP 数据模型 ============

/** 用户 VIP 信息模型（响应用） */
export const UserVipSchema = t.Object({
  id: t.Number({ description: "ID" }),
  userId: t.Number({ description: "用户 ID" }),
  vipTierId: t.Number({ description: "VIP 等级 ID" }),
  expireTime: t.Nullable(t.String({ description: "过期时间" })),
  status: t.Number({ description: "状态：1启用 0禁用" }),
  bindingStatus: t.Number({ description: "绑定状态：0待确认 1已确认" }),
  originalRoleId: t.Nullable(t.Number({ description: "原角色 ID" })),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** 用户 VIP 详情（含 VIP 等级信息） */
export const UserVipDetailSchema = t.Object({
  id: t.Number({ description: "ID" }),
  userId: t.Number({ description: "用户 ID" }),
  vipTierId: t.Number({ description: "VIP 等级 ID" }),
  expireTime: t.Nullable(t.String({ description: "过期时间" })),
  status: t.Number({ description: "状态：1启用 0禁用" }),
  bindingStatus: t.Number({ description: "绑定状态：0待确认 1已确认" }),
  vipTier: t.Optional(VipTierSchema),
  resourceLimits: t.Optional(t.Array(VipResourceLimitSchema)),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** 用户 VIP ID 参数 */
export const userVipIdParams = t.Object({
  id: t.Number({ description: "用户 VIP ID" }),
});

/** 用户 VIP 列表查询参数 */
export const userVipQueryParams = t.Object({
  page: t.Optional(t.Number({ description: "页码", minimum: 1, default: 1 })),
  pageSize: t.Optional(t.Number({ description: "每页数量", minimum: 1, default: 10 })),
  userId: t.Optional(t.Number({ description: "按用户 ID 筛选" })),
  vipTierId: t.Optional(t.Number({ description: "按 VIP 等级 ID 筛选" })),
  status: t.Optional(t.Number({ description: "按状态筛选：1启用 0禁用" })),
  bindingStatus: t.Optional(t.Number({ description: "按绑定状态筛选：0待确认 1已确认" })),
});

/** 用户 ID 参数 */
export const userIdParams = t.Object({
  userId: t.Number({ description: "用户 ID" }),
});

/** 升级用户 VIP 请求模型 */
export const upgradeUserVipBody = t.Object({
  userId: t.Number({ description: "用户 ID" }),
  vipTierCode: t.String({ description: "VIP 等级代码" }),
  expireTime: t.Optional(t.Nullable(t.String({ description: "过期时间，不传则根据 VIP 等级自动计算" }))),
}, { description: "升级用户 VIP 请求体" });

/** 确认 VIP 绑定请求模型 */
export const confirmVipBindingBody = t.Object({
  userVipId: t.Number({ description: "用户 VIP ID" }),
  confirm: t.Boolean({ description: "是否确认绑定" }),
}, { description: "确认 VIP 绑定请求体" });

// ============ 用户资源使用数据模型 ============

/** 用户资源使用信息模型（响应用） */
export const UserResourceUsageSchema = t.Object({
  id: t.Number({ description: "ID" }),
  userId: t.Number({ description: "用户 ID" }),
  resourceKey: t.String({ description: "资源键" }),
  usageCount: t.Number({ description: "已使用数量" }),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** 资源使用检查结果 */
export const ResourceCheckResultSchema = t.Object({
  resourceKey: t.String({ description: "资源键" }),
  currentUsage: t.Number({ description: "当前使用量" }),
  limitValue: t.Number({ description: "限制值" }),
  available: t.Number({ description: "剩余可用量，-1表示无限" }),
  canUse: t.Boolean({ description: "是否可以使用" }),
});

/** 增加资源使用请求模型 */
export const incrementResourceBody = t.Object({
  userId: t.Number({ description: "用户 ID" }),
  resourceKey: t.String({ description: "资源键" }),
  amount: t.Optional(t.Number({ description: "增加数量，默认1", default: 1 })),
}, { description: "增加资源使用请求体" });

/** 检查资源使用请求模型 */
export const checkResourceBody = t.Object({
  userId: t.Number({ description: "用户 ID" }),
  resourceKey: t.String({ description: "资源键" }),
  amount: t.Optional(t.Number({ description: "需要使用的数量，默认1", default: 1 })),
}, { description: "检查资源使用请求体" });
