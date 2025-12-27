import { useState, useEffect, useCallback, useRef } from 'react';

interface TransitionConfig {
  duration: number;
  easing: string;
  delay?: number;
}

interface UseSmoothTransitionReturn {
  isTransitioning: boolean;
  startTransition: (callback: () => void, config?: Partial<TransitionConfig>) => void;
  smoothValue: number;
  setValue: (value: number) => void;
}

export const useSmoothTransition = (
  initialValue: number = 0,
  config: TransitionConfig = { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
): UseSmoothTransitionReturn => {
  const [value, setValue] = useState(initialValue);
  const [smoothValue, setSmoothValue] = useState(initialValue);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // 缓动函数
  const easingFunctions = {
    'linear': (t: number) => t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'cubic-bezier(0.4, 0, 0.2, 1)': (t: number) => {
      // Material Design easing function approximation
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
  };

  const ease = easingFunctions[config.easing as keyof typeof easingFunctions] || easingFunctions['cubic-bezier(0.4, 0, 0.2, 1)'];

  // 动画循环
  const animate = useCallback((from: number, to: number, duration: number) => {
    const startTime = performance.now();
    startTimeRef.current = startTime;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress);
      
      const currentValue = from + (to - from) * easedProgress;
      setSmoothValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setIsTransitioning(false);
        setValue(to);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [ease]);

  // 开始过渡动画
  const startTransition = useCallback((callback: () => void, customConfig?: Partial<TransitionConfig>) => {
    const finalConfig = { ...config, ...customConfig };
    
    setIsTransitioning(true);
    const currentValue = smoothValue;
    
    // 清除之前的动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 执行回调
    callback();

    // 在下一个事件循环中开始动画，确保 DOM 更新完成
    setTimeout(() => {
      animate(currentValue, value, finalConfig.duration);
    }, finalConfig.delay || 0);
  }, [smoothValue, value, config, animate]);

  // 直接设置值
  const setValueWithTransition = useCallback((newValue: number) => {
    setValue(newValue);
    setSmoothValue(newValue);
  }, []);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isTransitioning,
    startTransition,
    smoothValue,
    setValue: setValueWithTransition,
  };
};

export default useSmoothTransition;