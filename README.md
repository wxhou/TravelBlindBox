# TravelBlindBox - 智能旅行盲盒生成器

一个基于AI的旅行路线生成器，支持传统REST API和现代化的MCP（Model Context Protocol）两种调用方式，为用户提供灵活的地图服务集成选择。

## 🚀 特性

- **🎯 智能路线生成**：基于AI的个性化旅行路线规划
- **🗺️ 双模式地图服务**：支持REST API和MCP Hook两种调用方式
- **📱 响应式设计**：优雅的用户界面，适配各种设备
- **🔧 可配置架构**：灵活的服务配置和扩展能力
- **🛡️ 错误处理**：完善的降级机制和错误恢复
- **📊 实时状态**：MCP连接状态和调用方式监控

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 7
- **样式方案**：Tailwind CSS
- **AI服务**：OpenAI GPT-4
- **地图服务**：高德地图 API
- **MCP协议**：@modelcontextprotocol/sdk
- **状态管理**：React Hooks

## 📋 环境配置

### 基础配置

复制 `.env.example` 到 `.env` 并配置以下环境变量：

```bash
# AI服务配置
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4-turbo-preview

# 高德地图配置
VITE_AMAP_API_KEY=your_amap_api_key_here
```

### MCP服务配置（可选）

```bash
# MCP服务配置
VITE_SERVICE_MODE=rest          # 可选值: 'rest' | 'mcp'
VITE_MCP_ENABLED=false          # 启用MCP功能: true | false
VITE_FALLBACK_ENABLED=true      # 启用降级机制: true | false
```

## 🔧 服务调用模式

### 1. REST API模式（默认）

传统的HTTP API调用方式，依赖高德地图官方REST API。

**优势：**
- 稳定可靠的服务质量
- 完整的高德地图功能支持
- 成熟的错误处理机制

**配置：**
```bash
VITE_SERVICE_MODE=rest
```

### 2. MCP Hook模式（实验性）

基于Model Context Protocol的现代化调用方式。

**优势：**
- 标准化的外部服务集成
- 更好的扩展性和兼容性
- 统一的工具调用接口

**配置：**
```bash
VITE_SERVICE_MODE=mcp
VITE_MCP_ENABLED=true
```

**注意：** MCP模式需要相应的MCP服务器支持，当前版本提供模拟实现。

## 🎮 使用说明

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 🏗️ 项目结构

```
src/
├── components/           # React组件
│   ├── TravelBlindBox.tsx    # 主要UI组件（含MCP切换）
│   └── ...
├── hooks/               # 自定义Hooks
│   ├── useAmapMcp.ts         # MCP Hook封装
│   └── ...
├── services/            # 服务层
│   ├── amapService.ts        # 原始高德服务
│   ├── mcpAmapService.ts     # MCP服务适配器
│   ├── unifiedAmapService.ts # 统一服务接口
│   ├── serviceConfig.ts      # 服务配置
│   └── travelService.ts      # AI旅行服务
├── types/               # TypeScript类型定义
└── ...
```

## 🔌 API调用方式切换

用户可以在界面中实时切换API调用方式：

1. **REST API模式**：使用传统高德地图API
2. **MCP Hook模式**：使用MCP协议调用（需MCP服务器支持）

切换状态会实时显示在界面上，包括：
- 连接状态指示器
- 当前使用的调用方式
- 错误状态和重连选项

## 🧪 测试和验证

### 验证现有功能不受影响

确保REST API模式下的所有功能正常工作：

```bash
npm run build
npm run preview
```

### 验证MCP功能

1. 确认MCP连接状态显示正常
2. 测试调用方式切换UI
3. 验证两种方式返回相同格式的数据
4. 测试错误处理和降级机制

## 📈 性能优化

- **懒加载**：按需加载组件和资源
- **缓存机制**：POI数据本地缓存
- **错误恢复**：自动降级到备用方案
- **状态管理**：高效的状态更新机制

## 🔧 开发和扩展

### 添加新的地图服务

1. 创建新的服务适配器，继承统一接口
2. 在 `serviceConfig.ts` 中注册新服务
3. 更新UI选择器添加新选项

### 自定义MCP服务器

1. 实现标准的MCP工具接口
2. 配置环境变量启用MCP模式
3. 根据需要调整数据转换逻辑

## 🤝 贡献指南

1. Fork本项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题或建议，请提交Issue或联系开发团队。

---

**注意：** MCP功能目前为实验性功能，生产环境建议使用默认的REST API模式。
