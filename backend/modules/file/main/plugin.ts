/**
 * 文件插件 - 提供文件访问能力
 */

import { Elysia } from 'elysia'
import type { Row } from '@/packages/orm'
import { fileService } from './service'
import SysFile from '@/models/sys-file'

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
  uploadLocal: (file: File, uploadBy: number) => Promise<Row<typeof SysFile>>
}

/**
 * 文件插件
 *
 * @example
 * ```ts
 * app
 *   .use(filePlugin())
 *   .get("/avatar/:id", async ({ file, params }) => {
 *     const result = await file.getFileContent(params.id);
 *     if (!result) return new Response("Not found", { status: 404 });
 *     return new Response(result.buffer, {
 *       headers: { "Content-Type": result.file.mimeType || "image/png" },
 *     });
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
    }
    return { file }
  })
}
