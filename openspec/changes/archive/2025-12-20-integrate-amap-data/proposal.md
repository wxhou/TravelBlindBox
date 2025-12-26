# Change: integrate-amap-data

## Why
目前TravelBlindBox生成的旅行路线数据完全依赖AI生成，缺乏真实世界的验证和权威数据支撑。用户在比较和选择路线时需要滚动浏览，体验不够流畅。集成高德地图MCP可以提供真实的POI数据、酒店信息和景区详情，提升内容的可靠性和实用性。同时，通过tab切换展示多条路线可以显著改善用户体验，避免繁琐的滚动操作。

## What Changes
- 将垂直堆叠的路线展示改为顶层tab切换，提升路线对比和切换便捷性
- 集成高德地图MCP服务，获取真实的旅行数据（酒店、景区、餐饮等）
- 修改AI生成逻辑，结合真实数据生成更准确的旅行推荐
- 优化UI布局，采用tab页签展示多条路线，避免上下滚动

## Impact
- 影响的规范：travel-ai, ui-ux
- 影响的代码：RouteDisplay组件、travelService、MCP服务集成
- 新增依赖：高德地图MCP服务</content>
</xai:function_call<parameter name="path">openspec/changes/integrate-amap-data/tasks.md