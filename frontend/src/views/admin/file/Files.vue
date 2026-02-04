<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace, useMessage, NUpload } from 'naive-ui'
import type { DataTableColumns, UploadFileInfo } from 'naive-ui'
import { CrudTable, CrudSearch, CrudConfirm, type SearchField } from '@/components'
import { useTable } from '@/composables'
import { fileApi, fileClientApi } from '@/api'
import type { SysFile } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'FileList' })

const message = useMessage()

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'originalName', label: '文件名', type: 'input' },
  {
    key: 'storageType',
    label: '存储类型',
    type: 'select',
    options: [
      { label: '本地存储', value: 'local' },
      { label: 'S3存储', value: 's3' },
    ],
  },
]

// 使用 useTable
const table = useTable<SysFile, { originalName?: string; storageType?: string }>({
  api: (params) => fileApi.list(params),
  opMap: { originalName: Op.Like },
})

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 表格列定义
const columns: DataTableColumns<SysFile> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '原始文件名', key: 'originalName', width: 200, ellipsis: { tooltip: true } },
  { title: '存储文件名', key: 'storageName', width: 200, ellipsis: { tooltip: true } },
  {
    title: '文件大小',
    key: 'size',
    width: 100,
    render: (row) => formatSize(row.size),
  },
  { title: 'MIME类型', key: 'mimeType', width: 150, ellipsis: { tooltip: true } },
  { title: '扩展名', key: 'extension', width: 80 },
  {
    title: '存储类型',
    key: 'storageType',
    width: 100,
    render: (row) =>
      h(NTag, { type: row.storageType === 'local' ? 'default' : 'info', size: 'small' }, () =>
        row.storageType === 'local' ? '本地' : 'S3',
      ),
  },
  {
    title: '上传时间',
    key: 'createdAt',
    width: 180,
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            tag: 'a',
            href: fileClientApi.getDownloadUrl(row.storagePath),
            target: '_blank',
            download: row.originalName,
          },
          () => '下载',
        ),
        h(CrudConfirm, {
          title: '确定要删除该文件吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

async function handleDelete(id: number) {
  try {
    await fileApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleUpload(options: { file: UploadFileInfo }) {
  if (!options.file.file) return
  try {
    await fileApi.upload(options.file.file)
    message.success('上传成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '上传失败')
  }
}
</script>

<template>
  <div class="page-files">
    <CrudTable
      title="文件管理"
      :columns="columns"
      :data="table.data.value"
      :loading="table.loading.value"
      :page="table.page.value"
      :page-size="table.pageSize.value"
      :total="table.total.value"
      @update:page="table.setPage"
      @update:page-size="table.setPageSize"
    >
      <template #toolbar>
        <CrudSearch
          v-model="table.query.value"
          :fields="searchFields"
          :loading="table.loading.value"
          @search="table.search"
          @reset="table.reset"
        />
      </template>

      <template #header-extra>
        <NUpload :show-file-list="false" :custom-request="handleUpload as any">
          <NButton type="primary">上传文件</NButton>
        </NUpload>
      </template>
    </CrudTable>
  </div>
</template>

<style scoped>
.page-files {
  height: 100%;
}
</style>
