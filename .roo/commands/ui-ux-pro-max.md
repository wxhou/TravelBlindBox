# UI/UX Pro Max

可搜索的 UI 样式、配色方案、字体搭配、图表类型、产品推荐、UX 指南和技术栈特定最佳实践数据库。
<!-- OPENSPEC:START -->
**Guardrails**
- 保持与原始 prompt 文档完全一致的工作流程和功能
- 默认技术栈为 `html-tailwind`，除非用户明确指定其他技术栈
- 遵循专业 UI 设计的通用规则和检查清单
- 确保所有交互元素都有适当的视觉反馈和可访问性

**Steps**
当用户请求 UI/UX 工作（设计、构建、创建、实施、审查、修复、改进）时，按以下步骤执行：

1. **分析用户需求**
   - 提取产品类型：SaaS、电商、作品集、仪表板、着陆页等
   - 识别风格关键词：简约、俏皮、专业、优雅、深色模式等
   - 确定行业：医疗保健、金融科技、游戏、教育等
   - 确定技术栈：React、Vue、Next.js，或默认为 `html-tailwind`

2. **执行搜索工作流程**
   按推荐顺序使用搜索命令：
   ```bash
   # 1. 产品类型
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain product
   
   # 2. 样式指南
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain style
   
   # 3. 字体搭配
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain typography
   
   # 4. 配色方案
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain color
   
   # 5. 页面结构（着陆页）
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain landing
   
   # 6. 图表类型（仪表板）
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain chart
   
   # 7. UX 指南
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain ux
   
   # 8. 技术栈特定指南
   python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <tech-stack>
   ```

3. **应用专业 UI 规则**
   - 不使用表情符号作为图标，使用 SVG 图标
   - 所有可点击元素添加 `cursor-pointer`
   - 提供清晰的悬停状态和过渡效果
   - 确保浅色/深色模式下的对比度
   - 保持一致的布局和间距

4. **交付前检查**
   验证以下项目：
   - [ ] 所有图标来自一致的图标集（Heroicons/Lucide）
   - [ ] 悬停状态不导致布局偏移
   - [ ] 响应式设计在 320px、768px、1024px、1440px 测试
   - [ ] 无障碍要求：alt 文本、标签、键盘导航
   - [ ] 尊重 `prefers-reduced-motion`

**Reference**
- 完整文档：`.github/prompts/ui-ux-pro-max.prompt.md`
- 搜索脚本：`.shared/ui-ux-pro-max/scripts/search.py`
- 可用域：product、style、typography、color、landing、chart、ux、prompt
- 可用技术栈：html-tailwind（默认）、react、nextjs、vue、svelte、swiftui、react-native、flutter
<!-- OPENSPEC:END -->