import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AnimationConfig {
  duration: number;
  easing: string;
  enableReducedMotion: boolean;
}

interface AnimationManagerProps {
  backgroundUrl: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  config?: Partial<AnimationConfig>;
  onAnimationComplete?: () => void;
}

const defaultConfig: AnimationConfig = {
  duration: 800,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enableReducedMotion: true,
};

const AnimationManager: React.FC<AnimationManagerProps> = ({
  backgroundUrl,
  children,
  className = '',
  style = {},
  config = {},
  onAnimationComplete,
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(1);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检测用户是否偏好减少动画
  const prefersReducedMotion = useCallback(() => {
    return finalConfig.enableReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [finalConfig.enableReducedMotion]);

  // 清理动画定时器
  const clearAnimationTimers = useCallback(() => {
    animationTimersRef.current.forEach(timer => clearTimeout(timer));
    animationTimersRef.current = [];
  }, []);

  // 开始动画序列
  const startAnimationSequence = useCallback(() => {
    if (prefersReducedMotion()) {
      setAnimationProgress(1);
      onAnimationComplete?.();
      return;
    }

    setIsAnimating(true);
    setAnimationProgress(0);

    // 模拟动画进度
    const timer = setTimeout(() => {
      setAnimationProgress(1);
      setIsAnimating(false);
      onAnimationComplete?.();
    }, finalConfig.duration);

    animationTimersRef.current = [timer];
  }, [
    prefersReducedMotion,
    finalConfig.duration,
    onAnimationComplete,
  ]);

  // 监听背景变化
  useEffect(() => {
    if (backgroundUrl) {
      startAnimationSequence();
    }
  }, [backgroundUrl, startAnimationSequence]);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearAnimationTimers();
    };
  }, [clearAnimationTimers]);

  // 计算动画样式
  const getAnimatedStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      ...style,
    };

    if (prefersReducedMotion()) {
      return baseStyles;
    }

    // 背景过渡效果
    if (isAnimating && animationProgress < 1) {
      baseStyles.backgroundSize = `${105 - animationProgress * 5}%`;
      baseStyles.filter = `blur(${animationProgress * 2}px) brightness(${1 - animationProgress * 0.1})`;
      baseStyles.transform = `scale(${1 + animationProgress * 0.02})`;
    }

    return baseStyles;
  };

  return (
    <div
      ref={containerRef}
      className={`animation-manager ${isAnimating ? 'animating' : ''} ${className}`}
      style={getAnimatedStyles()}
    >
      <div
        className="animation-content"
        style={{
          opacity: isAnimating ? 0.8 + animationProgress * 0.2 : 1,
          transform: `translateY(${(1 - animationProgress) * 10}px)`,
          transition: prefersReducedMotion() 
            ? 'none' 
            : `opacity ${finalConfig.duration}ms ${finalConfig.easing}, transform ${finalConfig.duration}ms ${finalConfig.easing}`,
        }}
      >
        {children}
      </div>
      
      {/* 动画进度指示器（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
          }}
        >
          Progress: {Math.round(animationProgress * 100)}% | Animating: {isAnimating.toString()}
        </div>
      )}
    </div>
  );
};

export default AnimationManager;