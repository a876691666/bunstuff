---
name: backend-basic
description: 涉及到后端开发时的指南，包括但不限于项目结构、数据库表设计、API设计开发、服务设计开发。关键词：后端开发、项目结构、数据库设计、API设计、服务设计、models、api、services、database schema、router、database seed
---

## 后端开发指南

### 新建模块时

通常来讲，后端模块的开发会涉及到以下几个方面：

- api：定义接口的输入输出，进行参数校验，编写接口文档
  - client api: 供客户端调用的接口，通常会放在 `api/_/{模块名称}` 目录下
  - admin api: 供管理员调用的接口，通常会放在 `api/admin/{模块名称}` 目录下
  - api config: 定义接口的公共配置，如接口前缀、权限等，通常会放在 `api/{模块名称}/config.ts` 文件中
- services：编写业务逻辑，处理数据的增删改查等操作，通常会放在 `services/{模块名称}` 目录下
- models: 定义数据库表结构，编写数据访问层代码，通常会放在 `models/{模块名称}` 目录下
  - schema: 定义数据库表结构，通常会放在 `models/{模块名称}/schema.ts` 文件中
  - seed: 定义数据库初始数据，通常会放在 `models/{模块名称}/seed.ts` 文件中

如果一个模块比较大，或者包含多个子模块，可以在 `models/{模块名称}` 目录下创建子目录来组织代码，如 `models/{模块名称}/{子模块名称}`。

每个文件的具体内容请参考 `elysia-crud-api` 技能。

### api config

- 通常来讲，普通用户不允许访问 admin api