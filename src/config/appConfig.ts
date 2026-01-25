/**
 * 应用配置常量
 * 所有硬编码的值应该在这里定义，便于统一管理和修改
 */

// 动画配置
export const ANIMATION_CONFIG = {
  // 卡片悬停缩放持续时间 (毫秒)
  hoverScaleDuration: 300,
  // 渐变过渡持续时间 (毫秒)
  gradientTransitionDuration: 300,
  // 图片淡入淡出持续时间 (毫秒)
  imageFadeDuration: 300,
  // 旋转动画持续时间 (毫秒)
  spinDuration: 2000,
  // 脉冲动画间隔 (毫秒)
  pulseInterval: 2000,
}

// 揭示阶段配置 - 精简版：移除"准备惊喜"阶段，让 ProgressiveReveal 专注于"揭晓"
export const REVEAL_PHASE_CONFIG = {
  ready: { title: '准备揭晓', icon: '🎁', duration: 2000 },
  theme: { title: '主题风格', icon: '✨', duration: 1500 },
  hints: { title: '线索提示', icon: '🔍', duration: 2000 },
  complete: { title: '路线揭晓', icon: '🎉', duration: 0 }
}

// 费用分配比例 (用于展示)
export const COST_RATIO = {
  accommodation: { min: 0.35, max: 0.45 },
  transportation: { min: 0.25, max: 0.35 },
  dining: { min: 0.15, max: 0.20 },
  tickets: { min: 0.10, max: 0.15 },
  other: { min: 0.05, max: 0.10 }
}

// 图片配置
export const IMAGE_CONFIG = {
  // 默认宽度
  defaultWidth: 800,
  // 默认高度
  defaultHeight: 600,
  // 图片质量
  quality: 80,
  // 缓存键前缀
  cachePrefix: 'route-image-'
}

// 评分范围
export const RATING_CONFIG = {
  min: 3.5,
  max: 5.0,
  decimalPlaces: 1
}

// 缓存配置
export const CACHE_CONFIG = {
  // 高德地图POI缓存超时时间 (毫秒)
  amapTimeout: 1000 * 60 * 30, // 30分钟
  // 最大缓存条目数
  maxEntries: 100
}

// 语音配置
export const VOICE_CONFIG = {
  defaultRate: 0.85,
  defaultPitch: 1.1,
  defaultVolume: 0.9
}

export default {
  ANIMATION_CONFIG,
  REVEAL_PHASE_CONFIG,
  COST_RATIO,
  IMAGE_CONFIG,
  RATING_CONFIG,
  CACHE_CONFIG,
  VOICE_CONFIG
}
