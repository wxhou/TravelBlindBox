import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AccessibilityConfig {
  enableHighContrast: boolean;
  enableFocusIndicators: boolean;
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableReducedMotion: boolean;
  minimumContrastRatio: number;
}

interface AccessibilityEnhancerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  config?: Partial<AccessibilityConfig>;
  onAccessibilityChange?: (config: AccessibilityConfig) => void;
}

const defaultConfig: AccessibilityConfig = {
  enableHighContrast: false,
  enableFocusIndicators: true,
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  enableReducedMotion: true,
  minimumContrastRatio: 4.5,
};

const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  children,
  className = '',
  style = {},
  config = {},
  onAccessibilityChange,
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [isHighContrast, setIsHighContrast] = useState(finalConfig.enableHighContrast);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 检测系统可访问性设置
  const detectSystemPreferences = useCallback(() => {
    // 检测高对比度模式
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(highContrastQuery.matches);

    // 检测减少动画偏好
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);

    // 监听系统偏好变化
    highContrastQuery.addEventListener('change', (e) => {
      setIsHighContrast(e.matches);
      updateAriaLive('系统高对比度设置已变更');
    });

    reducedMotionQuery.addEventListener('change', (e) => {
      setIsReducedMotion(e.matches);
      updateAriaLive('系统动画设置已变更');
    });
  }, []);

  // 更新 ARIA Live 区域
  const updateAriaLive = useCallback((message: string) => {
    if (!finalConfig.enableScreenReaderSupport) return;

    let liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;
    
    // 3秒后清空消息
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 3000);
  }, [finalConfig.enableScreenReaderSupport]);

  // 键盘导航处理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!finalConfig.enableKeyboardNavigation) return;

    // Tab 键导航增强
    if (event.key === 'Tab') {
      setFocusVisible(true);
      updateAriaLive('键盘导航模式已启用');
    }

    // Escape 键返回焦点
    if (event.key === 'Escape') {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        updateAriaLive('已返回焦点到之前的元素');
      }
    }

    // 空格键和回车键激活焦点元素
    if ((event.key === ' ' || event.key === 'Enter') && document.activeElement) {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement.getAttribute('role') === 'button' || 
          activeElement.tagName === 'BUTTON' ||
          activeElement.tagName === 'A') {
        activeElement.click();
        event.preventDefault();
      }
    }
  }, [finalConfig.enableKeyboardNavigation, updateAriaLive]);

  // 焦点管理
  const manageFocus = useCallback((event: FocusEvent) => {
    if (!finalConfig.enableFocusIndicators) return;

    previousActiveElement.current = event.relatedTarget as HTMLElement;
    
    // 为焦点元素添加可见指示器
    const target = event.target as HTMLElement;
    if (target) {
      target.setAttribute('data-focus-visible', 'true');
      updateAriaLive(`焦点已移动到 ${target.textContent || target.getAttribute('aria-label') || '未命名元素'}`);
    }
  }, [finalConfig.enableFocusIndicators, updateAriaLive]);

  // 移除焦点指示器
  const removeFocusIndicator = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (target) {
      target.removeAttribute('data-focus-visible');
    }
  }, []);

  // 生成动态样式
  const getAccessibilityStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      ...style,
    };

    // 高对比度模式
    if (isHighContrast) {
      styles.filter = 'contrast(1.5) saturate(0)';
      styles.backgroundColor = 'var(--high-contrast-bg, #000000)';
      styles.color = 'var(--high-contrast-text, #ffffff)';
    }

    // 减少动画
    if (isReducedMotion && finalConfig.enableReducedMotion) {
      styles.transition = 'none';
      styles.animation = 'none';
    }

    return styles;
  };

  // 生成动态类名
  const getAccessibilityClasses = (): string => {
    const classes = ['accessibility-enhancer'];
    
    if (isHighContrast) classes.push('high-contrast');
    if (isReducedMotion) classes.push('reduced-motion');
    if (focusVisible) classes.push('keyboard-navigation');
    
    return `${classes.join(' ')} ${className}`.trim();
  };

  // 切换高对比度模式
  const toggleHighContrast = useCallback(() => {
    const newState = !isHighContrast;
    setIsHighContrast(newState);
    updateAriaLive(`高对比度模式${newState ? '已启用' : '已禁用'}`);
  }, [isHighContrast, updateAriaLive]);

  // 组件挂载时检测系统偏好
  useEffect(() => {
    detectSystemPreferences();
    
    // 添加全局事件监听器
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', manageFocus);
    document.addEventListener('focusout', removeFocusIndicator);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', manageFocus);
      document.removeEventListener('focusout', removeFocusIndicator);
    };
  }, [detectSystemPreferences, handleKeyDown, manageFocus, removeFocusIndicator]);

  // 通知父组件配置变更
  useEffect(() => {
    if (onAccessibilityChange) {
      onAccessibilityChange({
        ...finalConfig,
        enableHighContrast: isHighContrast,
        enableReducedMotion: isReducedMotion,
      });
    }
  }, [isHighContrast, isReducedMotion, finalConfig, onAccessibilityChange]);

  return (
    <div
      ref={containerRef}
      className={getAccessibilityClasses()}
      style={getAccessibilityStyles()}
      role="application"
      aria-label="旅行盲盒应用 - 可访问性增强版本"
    >
      {/* 屏幕阅读器跳过链接 */}
      {finalConfig.enableScreenReaderSupport && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
          onClick={() => updateAriaLive('跳转到主要内容')}
        >
          跳转到主要内容
        </a>
      )}
      
      {/* 可访问性控制面板（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm z-50"
          role="region"
          aria-label="可访问性控制面板"
        >
          <h3 className="font-bold mb-2">可访问性设置</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isHighContrast}
                onChange={toggleHighContrast}
                aria-describedby="high-contrast-desc"
              />
              <span>高对比度</span>
            </label>
            <p id="high-contrast-desc" className="text-xs text-gray-300">
              启用高对比度模式以提高可读性
            </p>
            <div className="text-xs">
              <p>键盘导航: {focusVisible ? '已启用' : '未激活'}</p>
              <p>减少动画: {isReducedMotion ? '已启用' : '未启用'}</p>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default AccessibilityEnhancer;