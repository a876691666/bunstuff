# 登录日志

登录日志模块记录用户登录、登出、踢出等认证操作，便于安全审计。

## 🎯 功能概述

| 功能         | 说明                     |
| ------------ | ------------------------ |
| **登录记录** | 记录登录成功/失败        |
| **登出记录** | 记录用户主动登出         |
| **踢出记录** | 记录管理员强制下线       |
| **UA 解析**  | 自动解析浏览器和操作系统 |

## 🔌 loginLogPlugin

`loginLogPlugin` 提供 `loginLog` 上下文对象用于手动写入认证日志。

### 注入上下文

| 方法                      | 说明         |
| ------------------------- | ------------ |
| `loginLog.logLogin(data)` | 记录认证日志 |

### LoginAction 类型

| 值       | 说明     |
| -------- | -------- |
| `login`  | 登录     |
| `logout` | 登出     |
| `kick`   | 强制下线 |

### 使用示例

```typescript
app.use(loginLogPlugin()).post('/login', async ({ loginLog, body, request }) => {
  const result = await authService.login(body)

  await loginLog.logLogin({
    userId: result.user?.id,
    username: body.username,
    ip: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
    status: result.success ? 1 : 0,
    action: 'login',
    msg: result.message,
  })

  return R.ok(result)
})
```

## 🗄️ LoginLog 模型

| 字段        | 类型     | 说明                  |
| ----------- | -------- | --------------------- |
| `id`        | `number` | 主键                  |
| `userId`    | `number` | 用户 ID               |
| `username`  | `string` | 用户名                |
| `ip`        | `string` | 登录 IP               |
| `location`  | `string` | 地理位置              |
| `browser`   | `string` | 浏览器（自动解析）    |
| `os`        | `string` | 操作系统（自动解析）  |
| `status`    | `0 \| 1` | 状态：0 失败 / 1 成功 |
| `action`    | `string` | 操作类型              |
| `msg`       | `string` | 提示消息              |
| `loginTime` | `Date`   | 操作时间              |

::: tip User-Agent 解析
插件自动从 `User-Agent` 中识别浏览器（Chrome / Firefox / Safari / Edge / IE）和操作系统（Windows / MacOS / Linux / Android / iOS），无需外部依赖。
:::

## 📡 API 接口

| 方法     | 路径                         | 说明     | 权限                    |
| -------- | ---------------------------- | -------- | ----------------------- |
| `GET`    | `/api/admin/login-log`       | 日志列表 | `loginLog:admin:list`   |
| `GET`    | `/api/admin/login-log/:id`   | 日志详情 | `loginLog:admin:list`   |
| `DELETE` | `/api/admin/login-log/:id`   | 删除日志 | `loginLog:admin:delete` |
| `DELETE` | `/api/admin/login-log/clear` | 清空日志 | `loginLog:admin:delete` |
