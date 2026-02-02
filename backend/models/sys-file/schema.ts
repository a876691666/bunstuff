import { TimestampSchema, column } from '../../packages/orm'

/** 文件元数据表 Schema */
export default class SysFileSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement()
  /** 原始文件名 */
  originalName = column.string().default('')
  /** 存储文件名 */
  storageName = column.string().default('')
  /** 存储路径 */
  storagePath = column.string().default('')
  /** 文件大小 (字节) */
  size = column.number().default(0)
  /** MIME类型 */
  mimeType = column.string().nullable().default(null)
  /** 文件扩展名 */
  extension = column.string().nullable().default(null)
  /** 存储类型: local-本地 s3-S3存储 */
  storageType = column.string().default('local')
  /** S3 Bucket (仅S3存储时使用) */
  s3Bucket = column.string().nullable().default(null)
  /** 上传者ID */
  uploadBy = column.number().default(0)
  /** 文件MD5 */
  md5 = column.string().nullable().default(null)
}
