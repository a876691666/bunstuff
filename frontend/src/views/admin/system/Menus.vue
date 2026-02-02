<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
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
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { menuApi } from '@/api'
import type { Menu, MenuTree, CreateMenuRequest, UpdateMenuRequest } from '@/types'

defineOptions({
  name: 'SystemMenus',
})

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<Menu[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const menuTree = shallowRef<MenuTree[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, string>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增菜单')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreateMenuRequest & { id?: number }>({
  name: '',
  code: '',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  parentId: undefined,
  isHidden: false,
  isCache: true,
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { key: 'name', label: '菜单名称', type: 'input' },
  { key: 'code', label: '菜单编码', type: 'input' },
]

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
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleAddChild(row),
          },
          () => '添加子菜单',
        ),
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row),
          },
          () => '编辑',
        ),
        h(ConfirmButton, {
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

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await menuApi.list({
      page: page.value,
      pageSize: pageSize.value,
      ...searchParams.value,
    })
    data.value = res.data
    total.value = res.total
  } catch (err: any) {
    message.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载菜单树
async function loadMenuTree() {
  try {
    const res = await menuApi.tree()
    menuTree.value = res
  } catch (err: any) {
    console.error('加载菜单树失败', err)
  }
}

// 搜索
function handleSearch() {
  page.value = 1
  loadData()
}

// 重置
function handleReset() {
  page.value = 1
  loadData()
}

// 新增
function handleAdd() {
  editingId.value = null
  modalTitle.value = '新增菜单'
  Object.assign(formData, {
    name: '',
    code: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    parentId: undefined,
    isHidden: false,
    isCache: true,
  })
  modalVisible.value = true
}

// 添加子菜单
function handleAddChild(row: Menu) {
  editingId.value = null
  modalTitle.value = '新增子菜单'
  Object.assign(formData, {
    name: '',
    code: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    parentId: row.id,
    isHidden: false,
    isCache: true,
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: Menu) {
  editingId.value = row.id
  modalTitle.value = '编辑菜单'
  Object.assign(formData, {
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
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await menuApi.delete(id)
    message.success('删除成功')
    loadData()
    loadMenuTree()
  } catch (err: any) {
    message.error(err.message || '删除失败')
  }
}

// 保存
async function handleSave() {
  if (!formData.name || !formData.code) {
    message.warning('请填写必填项')
    return
  }

  modalLoading.value = true
  try {
    if (editingId.value) {
      await menuApi.update(editingId.value, formData as UpdateMenuRequest)
      message.success('更新成功')
    } else {
      await menuApi.create(formData as CreateMenuRequest)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
    loadMenuTree()
  } catch (err: any) {
    message.error(err.message || '保存失败')
  } finally {
    modalLoading.value = false
  }
}

// 分页
function handlePageChange(p: number) {
  page.value = p
  loadData()
}

function handlePageSizeChange(ps: number) {
  pageSize.value = ps
  page.value = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadMenuTree()
})
</script>

<template>
  <div class="page-menus">
    <PageTable
      title="菜单管理"
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="{
        page: page,
        pageSize: pageSize,
        pageCount: Math.ceil(total / pageSize),
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100],
        itemCount: total,
      }"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #toolbar>
        <SearchForm
          v-model="searchParams"
          :fields="searchFields"
          :loading="loading"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>

      <template #header-extra>
        <NButton type="primary" @click="handleAdd">新增菜单</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      width="600px"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="上级菜单">
          <NTreeSelect
            v-model:value="formData.parentId"
            :options="convertToTreeOptions(menuTree)"
            placeholder="选择上级菜单（不选则为顶级菜单）"
            clearable
            :disabled="!!editingId && formData.parentId === null"
          />
        </NFormItem>
        <NFormItem label="菜单名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入菜单名称" />
        </NFormItem>
        <NFormItem label="菜单编码" required>
          <NInput v-model:value="formData.code" placeholder="请输入菜单编码" />
        </NFormItem>
        <NFormItem label="路由路径">
          <NInput v-model:value="formData.path" placeholder="请输入路由路径，如 /system/user" />
        </NFormItem>
        <NFormItem label="组件路径">
          <NInput
            v-model:value="formData.component"
            placeholder="请输入组件路径，如 system/Users"
          />
        </NFormItem>
        <NFormItem label="菜单图标">
          <NInput v-model:value="formData.icon" placeholder="请输入图标名称" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber
            v-model:value="formData.sort"
            :min="0"
            placeholder="数字越小越靠前"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="是否隐藏">
          <NSwitch v-model:value="formData.isHidden" />
        </NFormItem>
        <NFormItem label="是否缓存">
          <NSwitch v-model:value="formData.isCache" />
        </NFormItem>
      </NForm>
    </FormModal>
  </div>
</template>

<style scoped>
.page-menus {
  height: 100%;
}
</style>
