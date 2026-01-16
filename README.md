# Travel Blind Box

AI智能旅行盲盒生成器 - 随机探索世界的惊喜之旅

## 简介

Travel Blind Box 是一款基于 AI 的旅行规划应用，为用户提供随机、惊喜的旅行路线建议。用户只需输入预算、偏好和时间，应用即可生成 3 条风格迥异的旅行路线。

## 功能特性

- **AI 智能规划**: 使用 GPT-4 生成独特的旅行路线
- **盲盒惊喜**: 每次生成 3 条风格迥异的路线
- **多模式支持**: REST API 和 MCP 两种服务模式
- **语音助手**: 支持语音输入和实时信息播报
- **路线历史**: 保存和回顾历史旅行规划
- **实时信息**: 集成天气、交通、景点状态等实时数据

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **AI 服务**: OpenAI GPT-4
- **地图服务**: 高德地图 API
- **语音服务**: Web Speech API

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

#### 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `VITE_OPENAI_API_KEY` | 是 | OpenAI API Key |
| `VITE_OPENAI_BASE_URL` | 否 | API 地址，默认为 `https://api.openai.com/v1` |
| `VITE_OPENAI_MODEL` | 否 | 模型名称，默认为 `gpt-4-turbo-preview` |
| `VITE_AMAP_API_KEY` | 是 | 高德地图 Web API Key |
| `VITE_SERVICE_MODE` | 否 | 服务模式，`rest` 或 `mcp`，默认为 `rest` |
| `VITE_MCP_ENABLED` | 否 | 是否启用 MCP，默认为 `false` |

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 运行

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── BlindBoxReveal.tsx    # 盲盒揭晓页面
│   ├── ErrorBoundary.tsx     # 错误边界组件
│   ├── LoadingSkeleton.tsx   # 加载骨架屏
│   ├── RouteHistory.tsx      # 历史记录
│   ├── TravelBlindBox.tsx    # 主表单组件
│   ├── VoiceAssistantUI.tsx  # 语音助手
│   └── steps/                # 表单步骤组件
├── hooks/                # 自定义 Hooks
│   ├── useAmapMcp.ts
│   ├── useBackgroundAnalysis.ts
│   ├── useGeolocation.ts
│   └── useWallpaperCache.ts
├── services/             # 服务层
│   ├── aiConfig.ts            # AI 配置
│   ├── prompts.ts             # AI 提示词
│   ├── travelService.ts       # 旅行路线生成
│   ├── unifiedAmapService.ts  # 统一地图服务
│   └── ...
├── types/                # TypeScript 类型定义
│   └── index.ts
├── utils/                # 工具函数
│   └── logger.ts
├── App.tsx               # 应用入口
└── main.tsx              # 渲染入口
```

## API 配置

### OpenAI API

1. 访问 [OpenAI Platform](https://platform.openai.com)
2. 创建 API Key
3. 在 `.env` 中设置 `VITE_OPENAI_API_KEY`

### 高德地图 API

1. 访问 [高德开放平台](https://lbs.amap.com)
2. 创建应用并获取 Web API Key
3. 在 `.env` 中设置 `VITE_AMAP_API_KEY`

## 开发

### 代码规范

```bash
# 运行 ESLint
npm run lint
```

### 类型检查

```bash
# TypeScript 编译检查
tsc -b
```

## 许可证

MIT License
