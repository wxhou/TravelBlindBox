# 智能语音助手增强提案

## 为什么
当前的TravelBlindBox仅有基础的语音播报功能，用户只能被动听取旅行路线信息。随着2025年旅行应用趋势的发展，用户需要更智能、更互动的语音助手来提升旅行体验，包括多语言支持、智能对话、语音控制和实时翻译功能。

## What Changes

- 扩展现有的`VoiceNarrationService`，升级为完整的`VoiceAssistantService`
- 添加多语言语音识别和合成支持（中文、英文、日文、韩文）
- 集成智能对话系统，支持旅行相关问答
- 实现语音控制导航功能
- 增加实时语音翻译能力
- 添加语音命令解析和意图识别
- 提供语音助手UI界面集成

## 影响
- 受影响的规范：voice-narration功能将扩展为voice-assistant
- 受影响的代码：
  - `src/services/voiceNarrationService.ts` → 重构为`VoiceAssistantService`
  - 新增语音识别、翻译、对话管理相关服务
  - UI组件需要添加语音助手交互界面
- 技术要求：
  - 集成Web Speech API的语音识别功能
  - 集成翻译API（Google Translate或类似服务）
  - AI对话逻辑集成（可能使用现有OpenAI服务）
  - 多语言语音合成优化

## 优先级
**高优先级** - 这是ROADMAP中Q1 2025的核心功能，直接提升用户体验