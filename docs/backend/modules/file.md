# 文件管理

文件管理模块提供文件上传、下载、删除等功能，支持本地存储和 S3 兼容云存储。

## 🎯 功能概述

| 功能 | 说明 |
|------|------|
| **文件上传** | 支持单文件/多文件上传，自动生成唯一文件名 |
| **文件下载** | 支持文件下载和流式读取 |
| **MD5 去重** | 相同文件不重复存储 |
| **按日期分目录** | 文件按 `YYYY/MM` 自动归档 |
| **多存储方式** | 本地存储 / S3 兼容云存储 |

## 🔌 filePlugin

`filePlugin` 向路由上下文注入 `file` 对象。

### 注入上下文

| 方法 | 说明 |
|------|------|
| `file.uploadLocal(file)` | 上传文件到本地存储 |
| `file.getFile(id)` | 获取文件元信息 |
| `file.getFileContent(id)` | 获取文件内容（流） |
| `file.getFileUrl(id)` | 获取文件访问 URL |

### 使用示例

```typescript
.post('/upload', async ({ body, file }) => {
  const result = await file.uploadLocal(body.file)
  return R.ok(result)
})

.get('/download/:id', async ({ params, file }) => {
  const content = await file.getFileContent(params.id)
  return content  // 返回流
})
```

## 🗄️ SysFile 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 主键 |
| `originalName` | `string` | 原始文件名 |
| `fileName` | `string` | 存储文件名 |
| `filePath` | `string` | 存储路径 |
| `fileSize` | `number` | 文件大小（字节） |
| `mimeType` | `string` | MIME 类型 |
| `md5` | `string` | 文件 MD5 哈希 |
| `storageType` | `string` | 存储类型：`local` / `s3` |
| `url` | `string` | 文件访问 URL |
| `createdBy` | `number` | 上传者 ID |
| `createdAt` | `datetime` | 上传时间 |
| `updatedAt` | `datetime` | 更新时间 |

## 📂 存储策略

### 本地存储

```
uploads/
└── 2026/
    └── 03/
        ├── abc123def456.jpg          # 唯一文件名
        ├── xyz789ghi012.pdf
        └── ...
```

- 文件存储在 `uploads/` 目录
- 按 `年/月` 自动分目录
- 文件名使用随机字符串，避免冲突
- 通过 `/uploads/` 前缀提供静态文件访问

### S3 兼容存储

支持所有 S3 兼容的对象存储服务：

- 阿里云 OSS
- 腾讯云 COS
- MinIO
- AWS S3

## 📡 API 接口

### 客户端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/_/file/upload` | 上传文件 |
| `GET` | `/api/_/file/:id` | 获取文件信息 |
| `GET` | `/api/_/file/download/:id` | 下载文件 |

### 管理端 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/admin/file` | 文件列表（分页） | `file:admin:list` |
| `DELETE` | `/api/admin/file/:id` | 删除文件 | `file:admin:delete` |

::: tip MD5 去重
上传文件时会计算 MD5 哈希值。如果已存在相同 MD5 的文件，将复用已有文件而不重复存储，节省磁盘空间。
:::
