import { TimestampSchema, column } from '../../packages/orm'

/** 文件元数据表 Schema */
export default class SysFileSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 原始文件名 */
  originalName = column.string().default('').description('原始文件名')
  /** 存储文件名 */
  storageName = column.string().default('').description('存储文件名')
  /** 存储路径 */
  storagePath = column.string().default('').description('存储路径')
  /** 文件大小 (字节) */
  size = column.number().default(0).description('文件大小(字节)')
  /** MIME类型 */
  mimeType = column.string().nullable().default(null).description('MIME类型')
  /** 文件扩展名 */
  extension = column.string().nullable().default(null).description('文件扩展名')
  /** 存储类型: local-本地 s3-S3存储 */
  storageType = column.string().default('local').description('存储类型')
  /** S3 Bucket (仅S3存储时使用) */
  s3Bucket = column.string().nullable().default(null).description('S3 Bucket')
  /** 上传者ID */
  uploadBy = column.number().default(0).description('上传者ID')
  /** 文件MD5 */
  md5 = column.string().nullable().default(null).description('文件MD5')
}
