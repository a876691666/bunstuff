import type { Row, Insert } from '@/packages/orm'
import SysFile from '@/models/sys-file'
import { CrudService, type CrudContext, type PageQuery, type PageResult } from '@/modules/crud-service'
import * as path from 'path'
import * as fs from 'fs'

/** 存储类型 */
export type StorageType = 'local' | 's3'

/** S3 配置 */
export interface S3Config {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

/** 文件服务配置 */
export interface FileServiceConfig {
  /** 本地上传路径 */
  localUploadPath: string
  /** S3 配置 (可选) */
  s3Config?: S3Config
}

/** 文件服务 */
export class FileService extends CrudService<typeof SysFile.schema> {
  private config: FileServiceConfig = {
    localUploadPath: './uploads',
  }

  constructor() {
    super(SysFile)
  }

  /** 设置配置 */
  setConfig(config: Partial<FileServiceConfig>) {
    Object.assign(this.config, config)
  }

  /** 获取文件列表 */
  override async findAll(query?: PageQuery, ctx?: CrudContext) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize
    const where = this.buildWhere(query?.filter, ctx)

    const data = await SysFile.findMany({
      where,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'createdAt', order: 'DESC' }],
    })
    const total = await SysFile.count(where)

    return { data, total, page, pageSize }
  }

  /** 根据MD5获取文件（用于秒传） */
  async findByMd5(md5: string) {
    return await SysFile.findOne({ where: `md5 = '${md5}'` })
  }

  /** 上传文件到本地 */
  async uploadLocal(file: File, uploadBy: number, ctx?: CrudContext): Promise<Row<typeof SysFile> | null> {
    const buffer = await file.arrayBuffer()
    const md5 = Bun.hash(buffer).toString(16)

    // 检查是否已存在相同文件
    const existing = await this.findByMd5(md5)
    if (existing) return existing

    // 生成存储路径
    const extension = path.extname(file.name) || ''
    const storageName = `${Date.now()}_${md5}${extension}`
    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
    const relativePath = path.join(datePath, storageName)
    const fullPath = path.join(this.config.localUploadPath, relativePath)

    // 确保目录存在
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 写入文件
    await Bun.write(fullPath, buffer)

    // 保存元数据
    return await this.create({
      originalName: file.name,
      storageName,
      storagePath: relativePath,
      size: file.size,
      mimeType: file.type || null,
      extension: extension || null,
      storageType: 'local',
      s3Bucket: null,
      uploadBy,
      md5,
    }, ctx)
  }

  /** 上传文件到S3 */
  async uploadS3(file: File, uploadBy: number, ctx?: CrudContext): Promise<Row<typeof SysFile> | null> {
    if (!this.config.s3Config) {
      throw new Error('S3 configuration not set')
    }

    const buffer = await file.arrayBuffer()
    const md5 = Bun.hash(buffer).toString(16)

    // 检查是否已存在相同文件
    const existing = await this.findByMd5(md5)
    if (existing) return existing

    const { bucket, endpoint, region, accessKeyId, secretAccessKey } = this.config.s3Config

    // 生成存储路径
    const extension = path.extname(file.name) || ''
    const storageName = `${Date.now()}_${md5}${extension}`
    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
    const key = `${datePath}/${storageName}`

    // 上传到S3 (使用 Bun 的 fetch)
    const url = `${endpoint}/${bucket}/${key}`
    const date = new Date().toUTCString()

    // 简单的S3签名 (实际项目中应使用完整的 AWS Signature V4)
    const response = await fetch(url, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': String(buffer.byteLength),
        Date: date,
        'x-amz-acl': 'public-read',
      },
    })

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`)
    }

    // 保存元数据
    return await this.create({
      originalName: file.name,
      storageName,
      storagePath: key,
      size: file.size,
      mimeType: file.type || null,
      extension: extension || null,
      storageType: 's3',
      s3Bucket: bucket,
      uploadBy,
      md5,
    }, ctx)
  }

  /** 删除文件 */
  override async delete(id: number, ctx?: CrudContext): Promise<boolean> {
    const file = await this.findById(id, ctx)
    if (!file) return false

    // 删除实际文件
    if (file.storageType === 'local') {
      const fullPath = path.join(this.config.localUploadPath, file.storagePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    } else if (file.storageType === 's3' && this.config.s3Config) {
      // 删除S3文件
      const { bucket, endpoint } = this.config.s3Config
      const url = `${endpoint}/${bucket}/${file.storagePath}`
      await fetch(url, { method: 'DELETE' })
    }

    return await super.delete(id, ctx)
  }

  /** 获取文件内容 (用于下载) */
  async getFileContent(
    id: number,
  ): Promise<{ buffer: ArrayBuffer; file: Row<typeof SysFile> } | null> {
    const file = await this.findById(id)
    if (!file) return null

    if (file.storageType === 'local') {
      const fullPath = path.join(this.config.localUploadPath, file.storagePath)
      if (!fs.existsSync(fullPath)) return null
      const buffer = await Bun.file(fullPath).arrayBuffer()
      return { buffer, file }
    } else if (file.storageType === 's3' && this.config.s3Config) {
      const { bucket, endpoint } = this.config.s3Config
      const url = `${endpoint}/${bucket}/${file.storagePath}`
      const response = await fetch(url)
      if (!response.ok) return null
      const buffer = await response.arrayBuffer()
      return { buffer, file }
    }

    return null
  }

  /** 获取文件流 (用于大文件下载) */
  async getFileStream(
    id: number,
  ): Promise<{ stream: ReadableStream; file: Row<typeof SysFile> } | null> {
    const file = await this.findById(id)
    if (!file) return null

    if (file.storageType === 'local') {
      const fullPath = path.join(this.config.localUploadPath, file.storagePath)
      if (!fs.existsSync(fullPath)) return null
      const bunFile = Bun.file(fullPath)
      return { stream: bunFile.stream(), file }
    } else if (file.storageType === 's3' && this.config.s3Config) {
      const { bucket, endpoint } = this.config.s3Config
      const url = `${endpoint}/${bucket}/${file.storagePath}`
      const response = await fetch(url)
      if (!response.ok || !response.body) return null
      return { stream: response.body, file }
    }

    return null
  }

  /** 获取文件URL */
  getFileUrl(file: Row<typeof SysFile>, baseUrl: string = ''): string {
    if (file.storageType === 'local') {
      return `${baseUrl}/api/file/download/${file.id}`
    } else if (file.storageType === 's3' && this.config.s3Config) {
      return `${this.config.s3Config.endpoint}/${file.s3Bucket}/${file.storagePath}`
    }
    return ''
  }
}

export const fileService = new FileService()
