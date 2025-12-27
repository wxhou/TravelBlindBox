import React, { useState, useEffect } from 'react';
import { useBackground } from '../hooks/useBackground';
import { useBackgroundAnalysis } from '../hooks/useBackgroundAnalysis';
import { useSmoothTransition } from '../hooks/useSmoothTransition';

import SmartOverlay from './SmartOverlay';
import TextEnhancer from './TextEnhancer';
import AnimationManager from './AnimationManager';
import AccessibilityEnhancer from './AccessibilityEnhancer';
import VisualDesignEnhancer from './VisualDesignEnhancer';

interface EnhancedBackgroundConfig {
  enableSmartOverlay: boolean;
  enableTextEnhancement: boolean;
  enableAnimations: boolean;
  enableAccessibility: boolean;
  enableVisualDesign: boolean;
  performanceMode: 'high' | 'balanced' | 'low';
  debugMode: boolean;
}

interface EnhancedBackgroundProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  config?: Partial<EnhancedBackgroundConfig>;
  onAnalysisComplete?: (analysis: any) => void;
  onPerformanceMetrics?: (metrics: any) => void;
}

const defaultConfig: EnhancedBackgroundConfig = {
  enableSmartOverlay: true,
  enableTextEnhancement: true,
  enableAnimations: true,
  enableAccessibility: true,
  enableVisualDesign: true,
  performanceMode: 'balanced',
  debugMode: false,
};

const EnhancedBackground: React.FC<EnhancedBackgroundProps> = ({
  children,
  className = '',
  style = {},
  config = {},
  onAnalysisComplete,
  onPerformanceMetrics,
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    analysisTime: 0,
    animationTime: 0,
    memoryUsage: 0,
  });

  // 背景管理
  const { 
    currentBackground, 
    setBackground: setBackgroundUrl,
    resetBackground,
    isCustomBackground
  } = useBackground();

  // 背景分析
  const { 
    analysis, 
    isAnalyzing, 
    analyzeBackground 
  } = useBackgroundAnalysis();

  // 平滑过渡
  const { 
    isTransitioning, 
    smoothValue,
    startTransition 
  } = useSmoothTransition(0, {
    duration: finalConfig.performanceMode === 'low' ? 300 : 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  });

  // 性能监控
  const startPerformanceMeasure = () => {
    if (finalConfig.performanceMode === 'low') return null;
    
    return {
      startTime: performance.now(),
      mark: (name: string) => {
        if (finalConfig.debugMode) {
          performance.mark(name);
        }
      }
    };
  };

  // 性能测量
  const measurePerformance = (name: string, fn: () => void) => {
    if (finalConfig.performanceMode === 'low') {
      fn();
      return;
    }

    const measure = startPerformanceMeasure();
    const startTime = performance.now();
    
    try {
      fn();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        [`${name}Time`]: duration,
      }));

      if (finalConfig.debugMode) {
        performance.measure(name, `${name}-start`, `${name}-end`);
      }

      if (onPerformanceMetrics) {
        onPerformanceMetrics({
          ...performanceMetrics,
          [`${name}Time`]: duration,
          timestamp: Date.now(),
        });
      }
    }
  };

  // 背景变化处理
  useEffect(() => {
    if (currentBackground && !isAnalyzing) {
      measurePerformance('analysis', () => {
        analyzeBackground(currentBackground);
      });
    }
  }, [currentBackground, analyzeBackground, isAnalyzing]);

  // 分析完成回调
  useEffect(() => {
    if (analysis && !isAnalyzing) {
      setIsLoaded(true);
      measurePerformance('render', () => {
        if (onAnalysisComplete) {
          onAnalysisComplete(analysis);
        }
      });
    }
  }, [analysis, isAnalyzing, onAnalysisComplete]);

  // 背景切换
  const handleBackgroundChange = (newBackgroundUrl: string) => {
    if (newBackgroundUrl === currentBackground) return;

    setIsLoading(true);
    setError(null);
    
    startTransition(() => {
      try {
        setBackgroundUrl(newBackgroundUrl);
        setIsLoading(false);
      } catch (err) {
        setError('背景设置失败');
        setIsLoading(false);
      }
    });
  };

  // 生成组件树
  const renderComponentTree = () => {
    let component = <>{children}</>;

    // 文本增强（最内层）
    if (finalConfig.enableTextEnhancement && analysis) {
      component = (
        <TextEnhancer 
          analysis={analysis}
          level={finalConfig.performanceMode === 'low' ? 'minimal' : 'enhanced'}
          enableStroke={analysis.contrastRatio < 4.5}
          enableGlow={finalConfig.performanceMode !== 'low'}
        >
          {component}
        </TextEnhancer>
      );
    }

    // 智能叠加层
    if (finalConfig.enableSmartOverlay && analysis) {
      component = (
        <SmartOverlay analysis={analysis}>
          {component}
        </SmartOverlay>
      );
    }

    // 动画管理器
    if (finalConfig.enableAnimations) {
      component = (
        <AnimationManager
          backgroundUrl={currentBackground || ''}
          config={{
            duration: finalConfig.performanceMode === 'low' ? 300 : 800,
            enableReducedMotion: true,
          }}
          onAnimationComplete={() => {
            measurePerformance('animation', () => {});
          }}
        >
          {component}
        </AnimationManager>
      );
    }

    // 视觉设计增强
    if (finalConfig.enableVisualDesign) {
      component = (
        <VisualDesignEnhancer
          analysis={analysis}
          config={{
            theme: 'auto',
            enableGlassmorphism: finalConfig.performanceMode !== 'low',
            enableNeumorphism: false,
            enableParallax: finalConfig.performanceMode === 'high',
            enableMicroInteractions: finalConfig.performanceMode !== 'low',
            colorScheme: 'default',
            animationStyle: finalConfig.performanceMode === 'high' ? 'moderate' : 'subtle',
          }}
        >
          {component}
        </VisualDesignEnhancer>
      );
    }

    return component;
  };

  // 可访问性增强（最外层）
  const finalComponent = finalConfig.enableAccessibility ? (
    <AccessibilityEnhancer
      config={{
        enableHighContrast: finalConfig.performanceMode === 'low',
        enableFocusIndicators: true,
        enableKeyboardNavigation: true,
        enableScreenReaderSupport: true,
        enableReducedMotion: finalConfig.performanceMode !== 'high',
      }}
    >
      {renderComponentTree()}
    </AccessibilityEnhancer>
  ) : renderComponentTree();

  // 生成主容器样式
  const getMainStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      ...style,
    };

    // 背景设置
    if (currentBackground) {
      if (currentBackground.startsWith('url(')) {
        styles.backgroundImage = currentBackground;
      } else {
        styles.background = currentBackground;
      }
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }

    // 过渡效果
    if (finalConfig.enableAnimations && isTransitioning) {
      styles.filter = `blur(${smoothValue * 2}px) brightness(${1 - smoothValue * 0.1})`;
      styles.transform = `scale(${1 + smoothValue * 0.01})`;
    }

    return styles;
  };

  return (
    <div
      className={`enhanced-background ${className}`}
      style={getMainStyles()}
      role="main"
      aria-label="旅行盲盒应用主界面"
    >
      {/* 加载状态 */}
      {(isLoading || isAnalyzing) && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            color: 'white',
            fontSize: '18px',
          }}
          aria-live="polite"
          aria-label="正在加载背景图片"
        >
          <div className="loading-spinner">
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ marginTop: '16px', marginLeft: '16px' }}>
              {isLoading ? '加载背景中...' : '分析背景中...'}
            </p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          className="error-overlay"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            zIndex: 1000,
          }}
          role="alert"
          aria-live="assertive"
        >
          背景加载失败: {error}
        </div>
      )}

      {/* 性能指标（调试模式） */}
      {finalConfig.debugMode && (
        <div
          className="performance-metrics"
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 9999,
            minWidth: '200px',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>性能指标</h4>
          <div>渲染时间: {performanceMetrics.renderTime.toFixed(2)}ms</div>
          <div>分析时间: {performanceMetrics.analysisTime.toFixed(2)}ms</div>
          <div>动画时间: {performanceMetrics.animationTime.toFixed(2)}ms</div>
          <div>状态: {isLoading ? '加载中' : isAnalyzing ? '分析中' : isLoaded ? '已完成' : '等待中'}</div>
        </div>
      )}

      {/* 主要内容 */}
      {finalComponent}

      {/* 全局样式 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedBackground;