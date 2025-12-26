# Change: Integrate AI Models for Travel Route Generation

## Why
当前系统使用模拟数据生成旅行路线，无法提供真实的AI驱动的个性化推荐。用户期望获得基于大语言模型的智能路线规划服务，以提供更准确、更个性化的旅行建议。

## What Changes
- 替换模拟的路线生成为真实的AI大模型调用
- 集成OpenAI GPT或Claude等大语言模型API
- 实现结构化提示工程，确保生成高质量的旅行路线
- 添加AI服务错误处理和重试机制
- 更新类型定义以支持AI生成的内容结构

## Impact
- 影响的规范：travel-ai 规范
- 影响的代码：travelService.ts、类型定义、API调用逻辑
- 用户体验：从固定模板生成升级为AI驱动的个性化内容</content>
</xai:function_call name="write_to_file">
<parameter name="path">openspec/changes/integrate-ai-models/tasks.md