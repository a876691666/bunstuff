import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Bunstuff',
  description: '基于 Bun + Elysia 的全栈后台管理系统',
  lang: 'zh-CN',
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: '后端', link: '/backend/', activeMatch: '/backend/' },
      { text: '前端', link: '/frontend/', activeMatch: '/frontend/' },
      { text: '自研包', link: '/packages/', activeMatch: '/packages/' },
      { text: '部署', link: '/deploy/', activeMatch: '/deploy/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '项目简介', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/structure' },
            { text: '技术栈', link: '/guide/tech-stack' },
            { text: '架构设计', link: '/guide/architecture' },
            { text: '开发规范', link: '/guide/conventions' },
          ],
        },
      ],
      '/backend/': [
        {
          text: '后端概览',
          items: [
            { text: '总览', link: '/backend/' },
            { text: '启动流程', link: '/backend/startup' },
            { text: '路由体系', link: '/backend/routing' },
            { text: '统一响应', link: '/backend/response' },
          ],
        },
        {
          text: '核心模块',
          items: [
            { text: '认证模块 (Auth)', link: '/backend/modules/auth' },
            { text: '权限模块 (RBAC)', link: '/backend/modules/rbac' },
            { text: 'CRUD 服务', link: '/backend/modules/crud-service' },
            { text: '动态 CRUD', link: '/backend/modules/crud' },
          ],
        },
        {
          text: '功能模块',
          items: [
            { text: 'VIP 会员', link: '/backend/modules/vip' },
            { text: '文件管理', link: '/backend/modules/file' },
            { text: '通知公告', link: '/backend/modules/notice' },
            { text: '定时任务', link: '/backend/modules/job' },
            { text: 'Seed 种子', link: '/backend/modules/seed' },
          ],
        },
        {
          text: '系统模块',
          items: [
            { text: '字典管理', link: '/backend/modules/dict' },
            { text: '参数配置', link: '/backend/modules/config' },
            { text: '操作日志', link: '/backend/modules/oper-log' },
            { text: '登录日志', link: '/backend/modules/login-log' },
            { text: 'API 限流', link: '/backend/modules/rate-limit' },
          ],
        },
        {
          text: '插件系统',
          items: [
            { text: '插件概览', link: '/backend/plugins/' },
            { text: '插件开发', link: '/backend/plugins/develop' },
          ],
        },
        {
          text: '数据模型',
          items: [
            { text: '模型总览', link: '/backend/models/' },
            { text: '模型定义规范', link: '/backend/models/define' },
          ],
        },
      ],
      '/frontend/': [
        {
          text: '管理端前端',
          items: [
            { text: '总览', link: '/frontend/' },
            { text: '路由系统', link: '/frontend/router' },
            { text: '状态管理', link: '/frontend/stores' },
            { text: 'HTTP 请求', link: '/frontend/http' },
            { text: 'API 层', link: '/frontend/api' },
          ],
        },
        {
          text: '组件与复用',
          items: [
            { text: '通用组件', link: '/frontend/components' },
            { text: '组合式函数', link: '/frontend/composables' },
            { text: 'CRUD 组件', link: '/frontend/crud-components' },
          ],
        },
        {
          text: '页面视图',
          items: [
            { text: '页面总览', link: '/frontend/views' },
            { text: '布局系统', link: '/frontend/layout' },
          ],
        },
        {
          text: '客户端',
          items: [
            { text: '客户端应用', link: '/frontend/client' },
          ],
        },
      ],
      '/packages/': [
        {
          text: '自研包',
          items: [
            { text: '总览', link: '/packages/' },
            { text: 'ORM', link: '/packages/orm' },
            { text: 'SSQL', link: '/packages/ssql' },
            { text: 'Route Model', link: '/packages/route-model' },
          ],
        },
      ],
      '/deploy/': [
        {
          text: '部署运维',
          items: [
            { text: '部署指南', link: '/deploy/' },
            { text: 'Docker 部署', link: '/deploy/docker' },
            { text: '本地构建', link: '/deploy/local' },
            { text: '环境配置', link: '/deploy/env' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/a876691666/bunstuff' },
    ],

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: '目录',
    },

    footer: {
      message: 'Bunstuff - 基于 Bun + Elysia 的全栈后台管理系统',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新',
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
  },
})
