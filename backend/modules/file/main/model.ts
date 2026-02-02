import { t } from 'elysia'

// ============ 文件模型 ============

/** 文件信息模型 */
export const SysFileSchema = t.Object({
  id: t.Number({ description: 'ID' }),
  originalName: t.String({ description: '原始文件名' }),
  storageName: t.String({ description: '存储文件名' }),
  storagePath: t.String({ description: '存储路径' }),
  size: t.Number({ description: '文件大小（字节）' }),
  mimeType: t.Nullable(t.String({ description: 'MIME类型' })),
  extension: t.Nullable(t.String({ description: '文件扩展名' })),
  storageType: t.String({ description: '存储类型：local/s3' }),
  s3Bucket: t.Nullable(t.String({ description: 'S3 Bucket' })),
  uploadBy: t.Number({ description: '上传者ID' }),
  md5: t.Nullable(t.String({ description: '文件MD5' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 文件ID参数 */
export const fileIdParams = t.Object({
  id: t.Numeric({ description: '文件ID' }),
})

/** 文件查询参数 */
export const fileQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
  filter: t.Optional(t.String({ description: 'SSQL过滤条件' })),
})
