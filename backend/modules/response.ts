/**
 * 统一响应包装工具
 * 提供简洁的 API 响应构建函数
 */

import { t, type TSchema } from "elysia";

/** 基础响应结构 */
export interface BaseResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

/** 分页响应结构 */
export interface PageResponse<T = unknown> extends BaseResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

/** 分页数据 */
export interface PageData<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ Swagger 响应模型 ============

/** 
 * 通用成功响应模型（带数据）
 * 使用 t.Unsafe 绕过运行时类型检查，仅用于 Swagger 文档生成
 */
export const SuccessResponse = <T extends TSchema>(dataSchema: T, description = "业务数据") =>
  t.Unsafe<BaseResponse<unknown>>(
    t.Object({
      code: t.Number({ description: "状态码，0表示成功", default: 0 }),
      message: t.String({ description: "响应消息", default: "success" }),
      data: t.Optional(dataSchema),
    }, { description })
  );

/** 通用成功响应模型（无数据） */
export const MessageResponse = t.Unsafe<BaseResponse>(
  t.Object({
    code: t.Number({ description: "状态码，0表示成功", default: 0 }),
    message: t.String({ description: "响应消息" }),
  }, { description: "操作结果响应" })
);

/** 分页响应模型 */
export const PagedResponse = <T extends TSchema>(itemSchema: T, description = "分页数据") =>
  t.Unsafe<PageResponse<unknown>>(
    t.Object({
      code: t.Number({ description: "状态码，0表示成功", default: 0 }),
      message: t.String({ description: "响应消息", default: "success" }),
      data: t.Optional(t.Array(itemSchema, { description: "数据列表" })),
      total: t.Number({ description: "总记录数" }),
      page: t.Number({ description: "当前页码" }),
      pageSize: t.Number({ description: "每页条数" }),
    }, { description })
  );

/** 错误响应模型 */
export const ErrorResponse = t.Unsafe<BaseResponse>(
  t.Object({
    code: t.Number({ description: "错误状态码" }),
    message: t.String({ description: "错误消息" }),
  }, { description: "错误响应" })
);

// ============ 成功响应 ============

/** 成功响应（带数据） */
export const ok = <T>(data: T, message = "success"): BaseResponse<T> => ({
  code: 0,
  message,
  data,
});

/** 成功响应（无数据） */
export const success = (message = "success"): BaseResponse => ({
  code: 0,
  message,
});

/** 分页成功响应 */
export const page = <T>(result: PageData<T>, message = "success"): PageResponse<T> => ({
  code: 0,
  message,
  data: result.data,
  total: result.total,
  page: result.page,
  pageSize: result.pageSize,
});

// ============ 错误响应 ============

/** 通用错误响应 */
export const fail = (message: string, code = 400): BaseResponse => ({
  code,
  message,
});

/** 404 不存在 */
export const notFound = (resource = "资源"): BaseResponse => ({
  code: 404,
  message: `${resource}不存在`,
});

/** 400 参数错误 / 业务错误 */
export const badRequest = (message: string): BaseResponse => ({
  code: 400,
  message,
});

/** 401 未授权 */
export const unauthorized = (message = "未登录"): BaseResponse => ({
  code: 401,
  message,
});

/** 403 禁止访问 */
export const forbidden = (message = "无权限"): BaseResponse => ({
  code: 403,
  message,
});

/** 500 服务器错误 */
export const serverError = (message = "服务器错误"): BaseResponse => ({
  code: 500,
  message,
});

// ============ 快捷别名 ============

export const R = {
  ok,
  success,
  page,
  fail,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} as const;

export default R;
