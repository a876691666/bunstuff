<script setup lang="ts">
import { shallowRef, onMounted, h } from 'vue'
import {
  NButton,
  NSpace,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NTreeSelect,
  NSwitch,
  NTag,
} from 'naive-ui'
import type { DataTableColumns, TreeSelectOption } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { menuApi } from '@/api'
import type { Menu, MenuTree, CreateMenuRequest, UpdateMenuRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemMenus' })

const message = useMessage()
const menuTree = shallowRef<MenuTree[]>([])

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '菜单名称', type: 'input' },
  { key: 'code', label: '菜单编码', type: 'input' },
]

// 使用 useTable
const table = useTable<Menu, { name?: string; code?: string }>({
  api: (params) => menuApi.list(params),
  opMap: { name: Op.Like, code: Op.Like },
})

// 使用 useModal
const modal = useModal<CreateMenuRequest & { id?: number }>({
  defaultData: {
    name: '',
    code: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    parentId: undefined,
    isHidden: false,
    isCache: true,
  },
  validate: (data) => {
    if (!data.name) return '请输入菜单名称'
    if (!data.code) return '请输入菜单编码'
    return null
  },
  createApi: (data) => menuApi.create(data),
  updateApi: (id, data) => menuApi.update(id, data as UpdateMenuRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
    loadMenuTree()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 菜单类型标签
function getMenuTypeTag(row: Menu) {
  if (!row.path && !row.component) {
    return h(NTag, { type: 'default', size: 'small' }, () => '目录')
  }
  if (row.component) {
    return h(NTag, { type: 'success', size: 'small' }, () => '菜单')
  }
  return h(NTag, { type: 'info', size: 'small' }, () => '链接')
}

// 表格列定义
const columns: DataTableColumns<Menu> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '菜单名称', key: 'name', width: 150 },
  { title: '菜单编码', key: 'code', width: 150 },
  { title: '类型', key: 'type', width: 80, render: getMenuTypeTag },
  {
    title: '路径',
    key: 'path',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) => row.path || '-',
  },
  {
    title: '组件',
    key: 'component',
    width: 200,
    ellipsis: { tooltip: true },
    render: (row) => row.component || '-',
  },
  { title: '图标', key: 'icon', width: 100, render: (row) => row.icon || '-' },
  { title: '排序', key: 'sort', width: 80 },
  {
    title: '隐藏',
    key: 'isHidden',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.isHidden ? 'warning' : 'default', size: 'small' }, () =>
        row.isHidden ? '是' : '否',
      ),
  },
  {
    title: '缓存',
    key: 'isCache',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.isCache ? 'success' : 'default', size: 'small' }, () =>
        row.isCache ? '是' : '否',
      ),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleAddChild(row) },
          () => '添加子菜单',
        ),
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        h(CrudConfirm, {
          title: '确定要删除该菜单吗？子菜单也会被删除！',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 转换菜单树为TreeSelect选项
function convertToTreeOptions(tree: MenuTree[]): TreeSelectOption[] {
  return tree.map((item) => ({
    key: item.id,
    label: item.name,
    value: item.id,
    children:
      item.children && item.children.length > 0 ? convertToTreeOptions(item.children) : undefined,
  }))
}

// 加载菜单树
async function loadMenuTree() {
  try {
    const res = await menuApi.tree()
    menuTree.value = res
  } catch (err: unknown) {
    console.error('加载菜单树失败', err)
  }
}

// 添加子菜单
function handleAddChild(row: Menu) {
  modal.open('新增子菜单')
  modal.formData.parentId = row.id
}

function handleEdit(row: Menu) {
  modal.edit(row.id, {
    name: row.name,
    code: row.code,
    path: row.path || '',
    component: row.component || '',
    icon: row.icon || '',
    sort: row.sort,
    parentId: row.parentId || undefined,
    isHidden: row.isHidden,
    isCache: row.isCache,
  })
}

async function handleDelete(id: number) {
  try {
    await menuApi.delete(id)
    message.success('删除成功')
    table.reload()
    loadMenuTree()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

onMounted(() => {
  loadMenuTree()
})
</script>

<template>
  <div class="page-menus">
    <CrudTable
      title="菜单管理"
      :columns="columns"
      :data="table.data.value"
      :loading="table.loading.value"
      v-model:page="table.page.value"
      v-model:page-size="table.pageSize.value"
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
        <NButton type="primary" @click="modal.open('新增菜单')">新增菜单</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      width="600px"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="上级菜单">
          <NTreeSelect
            v-model:value="modal.formData.parentId"
            :options="convertToTreeOptions(menuTree)"
            placeholder="选择上级菜单（不选则为顶级菜单）"
            clearable
            :disabled="modal.isEdit.value && modal.formData.parentId === null"
          />
        </NFormItem>
        <NFormItem label="菜单名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入菜单名称" />
        </NFormItem>
        <NFormItem label="菜单编码" required>
          <NInput v-model:value="modal.formData.code" placeholder="请输入菜单编码" />
        </NFormItem>
        <NFormItem label="路由路径">
          <NInput
            v-model:value="modal.formData.path"
            placeholder="请输入路由路径，如 /system/user"
          />
        </NFormItem>
        <NFormItem label="组件路径">
          <NInput
            v-model:value="modal.formData.component"
            placeholder="请输入组件路径，如 system/Users"
          />
        </NFormItem>
        <NFormItem label="菜单图标">
          <NInput v-model:value="modal.formData.icon" placeholder="请输入图标名称" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber
            v-model:value="modal.formData.sort"
            :min="0"
            placeholder="数字越小越靠前"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="是否隐藏">
          <NSwitch v-model:value="modal.formData.isHidden" />
        </NFormItem>
        <NFormItem label="是否缓存">
          <NSwitch v-model:value="modal.formData.isCache" />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-menus {
  height: 100%;
}
</style>
