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
  NSelect,
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

// 菜单类型选项
const menuTypeOptions = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
]

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '菜单名称', type: 'input' },
  { key: 'path', label: '路由路径', type: 'input' },
]

// 使用 useTable
const table = useTable<Menu, { name?: string; path?: string }>({
  api: (params) => menuApi.list(params),
  opMap: { name: Op.Like, path: Op.Like },
})

// 使用 useModal
const modal = useModal<CreateMenuRequest & { id?: number }>({
  defaultData: {
    name: '',
    path: '',
    component: null,
    icon: null,
    type: 2,
    visible: 1,
    status: 1,
    redirect: null,
    sort: 0,
    parentId: undefined,
    permCode: null,
  },
  validate: (data) => {
    if (!data.name) return '请输入菜单名称'
    if (!data.path) return '请输入路由路径'
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
  switch (row.type) {
    case 1:
      return h(NTag, { type: 'default', size: 'small' }, () => '目录')
    case 2:
      return h(NTag, { type: 'success', size: 'small' }, () => '菜单')
    case 3:
      return h(NTag, { type: 'info', size: 'small' }, () => '按钮')
    default:
      return h(NTag, { type: 'warning', size: 'small' }, () => '未知')
  }
}

// 表格列定义
const columns: DataTableColumns<Menu> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '菜单名称', key: 'name', width: 150 },
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
    title: '可见',
    key: 'visible',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.visible === 1 ? 'success' : 'warning', size: 'small' }, () =>
        row.visible === 1 ? '显示' : '隐藏',
      ),
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '启用' : '禁用',
      ),
  },
  {
    title: '权限标识',
    key: 'permCode',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) => row.permCode || '-',
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
    path: row.path,
    component: row.component,
    icon: row.icon,
    type: row.type,
    visible: row.visible,
    status: row.status,
    redirect: row.redirect,
    sort: row.sort,
    parentId: row.parentId || undefined,
    permCode: row.permCode,
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
        <NFormItem label="菜单类型">
          <NSelect
            v-model:value="modal.formData.type"
            :options="menuTypeOptions"
            placeholder="请选择菜单类型"
          />
        </NFormItem>
        <NFormItem label="菜单名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入菜单名称" />
        </NFormItem>
        <NFormItem label="路由路径" required>
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
        <NFormItem label="重定向地址">
          <NInput
            v-model:value="modal.formData.redirect"
            placeholder="请输入重定向地址"
          />
        </NFormItem>
        <NFormItem label="菜单图标">
          <NInput v-model:value="modal.formData.icon" placeholder="请输入图标名称" />
        </NFormItem>
        <NFormItem label="权限标识">
          <NInput v-model:value="modal.formData.permCode" placeholder="请输入权限标识，如 user:list" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber
            v-model:value="modal.formData.sort"
            :min="0"
            placeholder="数字越小越靠前"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="是否可见">
          <NSwitch
            :value="modal.formData.visible === 1"
            @update:value="(v: boolean) => (modal.formData.visible = v ? 1 : 0)"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSwitch
            :value="modal.formData.status === 1"
            @update:value="(v: boolean) => (modal.formData.status = v ? 1 : 0)"
          />
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
