# 登录日志

## 概述

登录日志模块记录所有登录/登出操作。位于 `modules/system/login-log/`。

## loginLogPlugin

通过 `derive` 注入日志记录工具：

```typescript
import { loginLogPlugin } from '@/modules/system/login-log/plugin'

const api = new Elysia()
  .use(loginLogPlugin())
  .post('/login', async (ctx) => {
    const result = await authService.login(username, password)
    
    // 记录登录日志
    ctx.logLogin({
      username,
      status: result ? 1 : 0,
      message: result ? '登录成功' : '密码错误',
    })
    
    return result
  })
```

### 注入方法

| 方法 | 说明 |
|------|------|
| `logLogin(data)` | 记录登录日志（自动填充 IP、UserAgent 等） |

## 记录内容

| 字段 | 说明 |
|------|------|
| username | 登录用户名 |
| ip | 登录 IP |
| userAgent | 浏览器 UA |
| status | 登录状态（1=成功 0=失败） |
| message | 提示消息 |
| loginTime | 登录时间 |

## 管理端 API

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/login-log` | `login-log:admin:list` |
| DELETE | `/api/admin/login-log/:id` | `login-log:admin:delete` |
