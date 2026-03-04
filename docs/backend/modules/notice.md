# 通知公告

通知公告模块提供系统通知的发布、管理和实时推送功能，支持 SSE 实时推送和已读状态追踪。

## 🎯 功能概述

| 功能             | 说明                        |
| ---------------- | --------------------------- |
| **通知发布**     | 发布系统通知和公告          |
| **精准推送**     | 支持全体推送和指定用户推送  |
| **SSE 实时推送** | Server-Sent Events 实时通知 |
| **已读追踪**     | 标记已读/未读，统计未读数量 |

## 🔌 noticePlugin

`noticePlugin` 向路由上下文注入 `notice` 对象。

### 注入上下文

| 方法                                  | 说明               |
| ------------------------------------- | ------------------ |
| `notice.publishNotice(data)`          | 发布通知           |
| `notice.sendToUser(userId, data)`     | 向指定用户发送通知 |
| `notice.markAsRead(noticeId, userId)` | 标记为已读         |
| `notice.getUnreadCount(userId)`       | 获取未读数量       |

### 使用示例

```typescript
// 发布系统公告
.post('/publish', async ({ body, notice }) => {
  await notice.publishNotice({
    title: body.title,
    content: body.content,
    type: 'announcement',
  })
  return R.success('发布成功')
})

// 向指定用户发送通知
.post('/send', async ({ body, notice }) => {
  await notice.sendToUser(body.userId, {
    title: '审批通知',
    content: '您的申请已通过',
  })
  return R.success('发送成功')
})
```

## 🗄️ 数据模型

### Notice（通知）

| 字段        | 类型       | 说明                                      |
| ----------- | ---------- | ----------------------------------------- |
| `id`        | `number`   | 主键                                      |
| `title`     | `string`   | 通知标题                                  |
| `content`   | `string`   | 通知内容                                  |
| `type`      | `string`   | 类型：`notice` 通知 / `announcement` 公告 |
| `status`    | `number`   | 状态：0 草稿 / 1 已发布                   |
| `createdBy` | `number`   | 创建者 ID                                 |
| `createdAt` | `datetime` | 创建时间                                  |
| `updatedAt` | `datetime` | 更新时间                                  |

### NoticeRead（已读记录）

| 字段       | 类型       | 说明     |
| ---------- | ---------- | -------- |
| `id`       | `number`   | 主键     |
| `noticeId` | `number`   | 通知 ID  |
| `userId`   | `number`   | 用户 ID  |
| `readTime` | `datetime` | 阅读时间 |

## 📡 SSE 实时推送

通过 Server-Sent Events 实现新通知的实时推送：

```
客户端                                    服务端
  │                                        │
  │  GET /api/_/notice/sse                 │
  │ ─────────────────────────────────────> │
  │                                        │
  │  event: notice                         │
  │  data: {"id":1,"title":"新通知",...}   │
  │ <───────────────────────────────────── │
  │                                        │
  │  event: notice                         │
  │  data: {"id":2,"title":"又一条",...}   │
  │ <───────────────────────────────────── │
  │                                        │
```

前端使用方式：

```typescript
const eventSource = new EventSource('/api/_/notice/sse', {
  headers: { Authorization: `Bearer ${token}` },
})

eventSource.addEventListener('notice', (event) => {
  const notice = JSON.parse(event.data)
  showNotification(notice.title, notice.content)
})
```

## 📡 API 接口

### 客户端 API

| 方法  | 路径                         | 说明             |
| ----- | ---------------------------- | ---------------- |
| `GET` | `/api/_/notice`              | 通知列表（分页） |
| `GET` | `/api/_/notice/unread-count` | 未读数量         |
| `PUT` | `/api/_/notice/:id/read`     | 标记已读         |
| `PUT` | `/api/_/notice/read-all`     | 全部已读         |
| `GET` | `/api/_/notice/sse`          | SSE 实时推送     |

### 管理端 API

| 方法     | 路径                    | 说明     | 权限                  |
| -------- | ----------------------- | -------- | --------------------- |
| `GET`    | `/api/admin/notice`     | 通知列表 | `notice:admin:list`   |
| `POST`   | `/api/admin/notice`     | 创建通知 | `notice:admin:create` |
| `PUT`    | `/api/admin/notice/:id` | 更新通知 | `notice:admin:update` |
| `DELETE` | `/api/admin/notice/:id` | 删除通知 | `notice:admin:delete` |
