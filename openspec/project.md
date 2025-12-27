# Project Context

## Purpose

TravelBlindBox是一个基于AI的智能旅行盲盒生成器，旨在为用户提供个性化的旅行路线规划体验。项目支持传统REST API和现代化的MCP（Model Context Protocol）两种服务调用方式，为用户提供灵活的地图服务集成选择。

核心功能包括：
- 🎯 AI驱动的智能路线生成
- 🗺️ 双模式地图服务集成（REST API + MCP Hook）
- 📱 响应式用户界面设计
- 🔧 可配置的服务架构
- 🛡️ 完善的错误处理和降级机制
- 📊 实时状态监控和连接管理

## Tech Stack

### 前端技术
- **React 19.2.0** - 主要前端框架
- **TypeScript 5.9.3** - 类型安全的JavaScript超集
- **Vite 7.2.4** - 现代化构建工具
- **Tailwind CSS 3.4.14** - 实用优先的CSS框架
- **PostCSS 8.4.47** - CSS后处理器
- **Autoprefixer 10.4.20** - CSS前缀自动添加

### 地图和定位服务
- **高德地图 API** - 主要地图服务提供商
- **@amap/amap-jsapi-loader 1.0.1** - 高德地图JavaScript API加载器

### AI服务
- **OpenAI API 6.15.0** - GPT-4驱动的旅行路线生成
- **lucide-react 0.562.0** - 现代化图标库

### 协议和标准
- **@modelcontextprotocol/sdk 1.25.1** - MCP协议SDK
- **react-range 1.10.0** - 范围选择器组件

### 开发工具
- **ESLint 9.39.1** - 代码质量检查
- **TypeScript ESLint 8.46.4** - TypeScript专用ESLint规则
- **@vitejs/plugin-react 5.1.1** - Vite React插件
- **@types/*** - 完整的TypeScript类型定义

### 构建和配置
- **项目类型**: ES模块（"type": "module"）
- **包管理器**: npm
- **配置文件**: 分离的tsconfig.app.json和tsconfig.node.json

## Project Conventions

### Code Style

#### TypeScript规范
- 严格模式TypeScript配置
- 使用完整的类型定义，不使用`any`类型
- 接口优先的设计原则
- 统一使用ES模块语法

#### React开发规范
- 函数组件 + Hooks模式
- 自定义Hook用于逻辑复用
- 使用TypeScript接口定义Props类型
- 组件文件使用.tsx扩展名

#### 命名约定
- **组件**: PascalCase（如`TravelBlindBox.tsx`）
- **函数和变量**: camelCase（如`useAmapMcp`）
- **常量**: UPPER_SNAKE_CASE（如`SERVICE_MODES`）
- **文件**: kebab-case（如`service-config.ts`）

#### 代码组织
- 组件、Hook、服务分层组织
- 相关功能文件集中管理
- 类型定义单独文件维护

### Architecture Patterns

#### 服务层架构
- **统一服务接口模式**: `unifiedAmapService.ts`定义统一接口
- **适配器模式**: `amapService.ts`和`mcpAmapService.ts`分别实现不同调用方式
- **配置驱动**: `serviceConfig.ts`管理服务配置和切换逻辑

#### 状态管理
- React Hooks用于本地状态管理
- Context API用于跨组件状态共享
- 自定义Hook封装复杂业务逻辑

#### 错误处理
- 分层错误处理机制
- 服务降级和重试策略
- 用户友好的错误提示

### Testing Strategy

当前项目暂无正式测试配置，但建议的测试策略：
- **单元测试**: Jest + React Testing Library
- **集成测试**: Cypress端到端测试
- **API测试**: 模拟MCP服务和REST API响应
- **组件测试**: 测试关键UI组件交互

### Git Workflow

#### 分支策略
- **main**: 生产就绪代码
- **develop**: 开发集成分支
- **feature/**: 功能开发分支
- **hotfix/**: 紧急修复分支

#### 提交约定
遵循约定式提交格式：
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具

## Domain Context

### 旅行规划领域知识
- POI（兴趣点）数据结构和搜索
- 路线规划和导航算法
- 地理位置编码和逆地理编码
- 旅行时间估算和优化

### 地图服务集成
- 高德地图API的使用规范和限制
- MCP协议的标准接口定义
- 地图数据的坐标系统转换
- 实时交通和路径优化

### AI服务集成
- OpenAI API的调用模式
- 旅行相关的Prompt工程
- AI生成内容的结构化处理
- 错误处理和重试机制

## Important Constraints

### 技术约束
- **浏览器兼容性**: 现代浏览器（ES2020+）
- **API限制**: 高德地图API调用频率限制
- **MCP支持**: 需要MCP服务器支持相应功能
- **TypeScript严格模式**: 不允许隐式any类型

### 业务约束
- **环境变量依赖**: 需要配置多个API密钥
- **网络依赖**: 需要稳定的网络连接
- **地理服务**: 依赖第三方地图服务商
- **AI服务**: 依赖OpenAI API的可用性

### 安全约束
- API密钥通过环境变量管理
- 客户端暴露敏感配置信息需谨慎
- CORS策略对外部API调用的影响

## External Dependencies

### 核心服务依赖
- **高德地图Web服务**: 地图数据、路径规划、POI搜索
- **OpenAI API**: AI驱动的旅行路线生成
- **MCP服务器**: 标准化服务调用接口（实验性）

### 第三方库依赖
- React生态系统包
- TypeScript类型定义包
- 构建和开发工具包

### 基础设施依赖
- npm包注册中心
- 现代浏览器环境
- 稳定的网络连接

### 可选依赖
- MCP协议服务器（用于实验性功能）
- 自部署的地图服务实例
- 第三方地理编码服务

---

**项目维护者**: TravelBlindBox开发团队  
**最后更新**: 2025-12-27  
**文档版本**: v1.0.0
