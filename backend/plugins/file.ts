import { Elysia } from 'elysia'
import type { Row } from '@/packages/orm'
import * as fileService from '@/services/file'
import { model } from '@/core/model'

const SysFile = model.sys_file

/** 文件上下文 */
export interface FileContext {
  /** 根据ID获取文件 */
  getFile: (id: number) => Promise<Row<typeof SysFile> | null>
  /** 获取文件内容 */
  getFileContent: (id: number) => Promise<{ buffer: ArrayBuffer; file: Row<typeof SysFile> } | null>
  /** 获取文件流 */
  getFileStream: (
    id: number,
  ) => Promise<{ stream: ReadableStream; file: Row<typeof SysFile> } | null>
  /** 获取文件URL */
  getFileUrl: (file: Row<typeof SysFile>, baseUrl?: string) => string
  /** 上传文件到本地 */
  uploadLocal: (file: File, uploadBy: number) => Promise<Row<typeof SysFile> | null>
  /** 确认文件为永久存储（传 storagePath） */
  confirmFile: (storagePath: string) => Promise<boolean>
  /** 批量确认文件 */
  confirmFiles: (storagePaths: string[]) => Promise<number>
}

/**
 * 文件插件
 *
 * @example
 * ```ts
 * app
 *   .use(filePlugin())
 *   .post("/save", async ({ file, body }) => {
 *     // 提交时确认临时文件为永久
 *     if (body.imageUrl) await file.confirmFile(body.imageUrl);
 *   })
 * ```
 */
export function filePlugin() {
  return new Elysia({ name: 'file-plugin' }).derive({ as: 'global' }, () => {
    const file: FileContext = {
      getFile: (id) => fileService.findById(id),
      getFileContent: (id) => fileService.getFileContent(id),
      getFileStream: (id) => fileService.getFileStream(id),
      getFileUrl: (f, baseUrl) => fileService.getFileUrl(f, baseUrl),
      uploadLocal: (f, uploadBy) => fileService.uploadLocal(f, uploadBy),
      confirmFile: (storagePath) => fileService.confirmFile(storagePath),
      confirmFiles: (storagePaths) => fileService.confirmFiles(storagePaths),
    }
    return { file }
  })
}
