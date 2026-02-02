/**
 * Notice 模块统一导出
 * 
 * 包含子模块:
 * - main: 通知公告核心功能
 */

// ============ Main 模块导出 ============
export { noticeAdminController } from "./main/api_admin";
export { noticeController } from "./main/api_client";
export { noticeService, NoticeService, noticeSSE } from "./main/service";
export { noticePlugin } from "./main/plugin";
export type { NoticeContext } from "./main/plugin";
export {
  NoticeSchema, NoticeWithReadSchema,
  createNoticeBody, updateNoticeBody,
  noticeIdParams, noticeQueryParams,
} from "./main/model";
