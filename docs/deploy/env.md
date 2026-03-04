# 环境变量

Bunstuff 通过环境变量控制运行时行为。

## 📋 变量列表

| 变量            | 默认值        | 说明                                   |
| --------------- | ------------- | -------------------------------------- |
| `NODE_ENV`      | `development` | 运行环境：`development` / `production` |
| `SEED_AUTO_RUN` | `false`       | 是否启动时自动执行 Seed                |
| `PORT`          | `3000`        | HTTP 监听端口                          |

## 🔧 开发环境

开发时无需手动设置，使用默认值即可：

```bash
bun run dev:backend
```

## 🚀 生产环境

### Docker

在 `docker-compose.yml` 中配置：

```yaml
environment:
  - NODE_ENV=production
  - SEED_AUTO_RUN=true
```

### 本地部署

通过 `export` 设置或写入 `.env`：

```bash
export NODE_ENV=production
export SEED_AUTO_RUN=true
bun run index.js
```

::: tip SEED_AUTO_RUN
首次部署时设为 `true`，Seed 执行完成后可改为 `false`。Seed 系统会记录已执行的 Seed，重复运行不会重复执行。
:::

## 📦 数据库配置

数据库连接在 `backend/models/main.ts` 中配置：

```typescript
import { DB } from '@/packages/orm'

// SQLite（默认）
export const db = new DB('data/myapp.db')

// 如需切换 MySQL
export const db = new DB('mysql://user:pass@localhost:3306/mydb')

// 如需切换 PostgreSQL
export const db = new DB('postgres://user:pass@localhost:5432/mydb')
```

::: warning 注意
切换数据库类型需要修改源码并重新编译。ORM 会自动处理 SQL 方言差异。
:::
