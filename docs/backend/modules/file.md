# 文件管理

## 概述

文件模块提供文件上传、存储和访问功能，支持本地存储和 S3 兼容存储。位于 `modules/file/`。

## filePlugin

通过 `derive` 注入文件操作工具：

```typescript
import { filePlugin } from '@/modules/file/plugin'

const api = new Elysia()
  .use(authPlugin())
  .use(filePlugin())
  .post('/upload', async (ctx) => {
    const file = ctx.body.file
    const result = await ctx.uploadLocal(file)
    return R.ok(result)
  })
```

### 注入方法

| 方法 | 说明 |
|------|------|
| `getFile(id)` | 获取文件信息 |
| `getFileContent(id)` | 获取文件内容 |
| `getFileStream(id)` | 获取文件流 |
| `getFileUrl(id)` | 获取文件访问 URL |
| `uploadLocal(file)` | 上传到本地存储 |

## SysFile 模型

| 字段 | 说明 |
|------|------|
| originalName | 原始文件名 |
| storageName | 存储文件名 |
| storagePath | 存储路径 |
| size | 文件大小 |
| mimeType | MIME 类型 |
| extension | 文件扩展名 |
| storageType | 存储类型（local/s3） |
| s3Bucket | S3 桶名 |
| uploadBy | 上传者 ID |
| md5 | 文件 MD5 |

## 存储策略

### 本地存储

文件存储在 `uploads/` 目录，按日期分目录：

```
uploads/
└── 2026/
    └── 02/
        ├── abc123.jpg
        └── def456.pdf
```

### S3 存储

支持任何 S3 兼容的对象存储（AWS S3、MinIO、阿里云 OSS 等）。

## API

### 客户端

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/file/upload` | 上传文件 |
| GET | `/api/file/:id` | 下载文件 |

### 管理端

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/admin/file` | `file:admin:list` | 文件列表 |
| DELETE | `/api/admin/file/:id` | `file:admin:delete` | 删除文件 |
