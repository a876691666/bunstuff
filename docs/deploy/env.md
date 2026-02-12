# 环境配置

## 数据库配置

数据库连接在 `backend/models/main.ts` 中配置：

```typescript
import { DB } from '@pkg/orm'

// SQLite（默认，零配置）
export const db = new DB('sqlite://data/myapp.db')

// MySQL
export const db = new DB('mysql://user:password@localhost:3306/bunstuff')

// PostgreSQL
export const db = new DB('postgres://user:password@localhost:5432/bunstuff')
```

### SQLite

- 无需安装额外数据库软件
- 数据文件：`backend/data/myapp.db`
- 适合开发环境和中小规模部署
- 需确保 `data/` 目录可写

### MySQL

- 需要 MySQL 5.7+ 或 8.0+
- 预先创建数据库
- 表由 ORM 自动创建

### PostgreSQL

- 需要 PostgreSQL 12+
- 预先创建数据库
- 表由 ORM 自动创建

## 端口配置

| 服务 | 端口 | 配置位置 |
|------|------|---------|
| 后端 | 3000 | `backend/index.ts` → `listen(3000)` |
| 前端（开发） | 5173 | `frontend/vite.config.ts` |
| 客户端（开发） | 5174 | `client/vite.config.ts` |

## CORS 配置

在 `backend/index.ts` 中配置跨域策略：

```typescript
import cors from '@elysiajs/cors'

app.use(cors({
  origin: '*',           // 生产环境建议设置具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
```

## Session 配置

Session 相关配置在 `modules/auth/main/session.ts`：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| Token 长度 | 64 字符 | `randomBytes(32).hex` |
| 过期时间 | 24 小时 | `expiresAt` |
| 清理周期 | 1 分钟 | 定时清理过期 Session |

## 文件上传配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 存储目录 | `uploads/` | 本地存储根目录 |
| 存储结构 | `uploads/YYYY/MM/` | 按年月分目录 |
| 存储类型 | local | 可选 local / s3 |

## 生产环境检查清单

- [ ] 修改默认管理员密码
- [ ] 配置具体 CORS 域名
- [ ] 配置反向代理（Nginx）
- [ ] 配置 HTTPS
- [ ] 配置数据库（生产建议使用 MySQL/PostgreSQL）
- [ ] 配置文件上传限制
- [ ] 配置限流规则
- [ ] 确保数据目录持久化
- [ ] 配置日志收集
- [ ] 配置定时备份
