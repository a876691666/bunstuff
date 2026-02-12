# 通知公告

## 概述

通知模块提供通知发布、SSE 实时推送和已读状态追踪。位于 `modules/notice/`。

## noticePlugin

通过 `derive` 注入通知操作工具：

```typescript
import { noticePlugin } from '@/modules/notice/plugin'

const api = new Elysia()
  .use(authPlugin())
  .use(noticePlugin())
  .post('/send', async (ctx) => {
    await ctx.publishNotice({
      title: '系统更新',
      content: '系统已升级到新版本',
      type: 1,
    })
    return R.success('发送成功')
  })
```

### 注入方法

| 方法 | 说明 |
|------|------|
| `publishNotice(data)` | 发布通知 |
| `sendToUser(userId, data)` | 发送给指定用户 |
| `markAsRead(noticeId, userId)` | 标记已读 |
| `getUnreadCount(userId)` | 获取未读数量 |

## SSE 实时推送

通过 Server-Sent Events 实现实时通知推送：

```
前端建立 SSE 连接
  → GET /api/notice/sse（EventSource）
  → 服务端保持连接
  → 有新通知时推送事件
  → 前端接收并显示
```

## 数据模型

### Notice（通知）

| 字段 | 说明 |
|------|------|
| title | 通知标题 |
| content | 通知内容 |
| type | 通知类型 |
| status | 状态 |
| createBy | 创建者 |

### NoticeRead（已读记录）

记录每个用户对每条通知的阅读状态。

## API

### 客户端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notice` | 通知列表 |
| GET | `/api/notice/unread-count` | 未读数量 |
| POST | `/api/notice/:id/read` | 标记已读 |
| GET | `/api/notice/sse` | SSE 实时推送 |

### 管理端

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/admin/notice` | `notice:admin:list` | 通知列表 |
| POST | `/api/admin/notice` | `notice:admin:create` | 发布通知 |
| PUT | `/api/admin/notice/:id` | `notice:admin:update` | 更新通知 |
| DELETE | `/api/admin/notice/:id` | `notice:admin:delete` | 删除通知 |
