import { t } from "elysia";

// ============ 登录日志模型 ============

/** 登录日志信息模型 */
export const LoginLogSchema = t.Object({
  id: t.Number({ description: "ID" }),
  userId: t.Nullable(t.Number({ description: "用户ID" })),
  username: t.String({ description: "用户名" }),
  ip: t.Nullable(t.String({ description: "IP地址" })),
  location: t.Nullable(t.String({ description: "登录地点" })),
  browser: t.Nullable(t.String({ description: "浏览器" })),
  os: t.Nullable(t.String({ description: "操作系统" })),
  status: t.Number({ description: "状态：1成功 0失败" }),
  action: t.String({ description: "操作类型：login/logout/kick" }),
  msg: t.Nullable(t.String({ description: "提示消息" })),
  loginTime: t.String({ description: "登录时间" }),
});

/** 登录日志ID参数 */
export const loginLogIdParams = t.Object({
  id: t.Numeric({ description: "登录日志ID" }),
});

/** 登录日志查询参数 */
export const loginLogQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: "页码", default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: "每页条数", default: 10, minimum: 1 })),
  username: t.Optional(t.String({ description: "用户名" })),
  ip: t.Optional(t.String({ description: "IP地址" })),
  status: t.Optional(t.Numeric({ description: "状态" })),
  action: t.Optional(t.String({ description: "操作类型" })),
  startTime: t.Optional(t.String({ description: "开始时间" })),
  endTime: t.Optional(t.String({ description: "结束时间" })),
});
