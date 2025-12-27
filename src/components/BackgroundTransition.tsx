import React, { useEffect, useState } from 'react';
import { useSmoothTransition } from '../hooks/useSmoothTransition';

interface BackgroundTransitionProps {
  backgroundUrl: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  overlay?: boolean;
}

const BackgroundTransition: React.FC<BackgroundTransitionProps> = ({
  backgroundUrl,
  children,
  className = '',
  style = {},
  duration = 800,
  overlay = true,
}) => {
  const [currentBackground, setCurrentBackground] = useState(backgroundUrl);
  const [nextBackground, setNextBackground] = useState(backgroundUrl);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { isTransitioning: isAnimating, smoothValue } = useSmoothTransition(0, {
    duration,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  });

  // 监听背景URL变化
  useEffect(() => {
    if (backgroundUrl !== currentBackground && !isTransitioning) {
      setIsTransitioning(true);
      setNextBackground(backgroundUrl);
      
      // 延迟切换当前背景，让用户看到过渡效果
      setTimeout(() => {
        setCurrentBackground(backgroundUrl);
        setIsTransitioning(false);
      }, 100);
    }
  }, [backgroundUrl, currentBackground, isTransitioning]);

  // 计算过渡动画的样式
  const getTransitionStyles = (): React.CSSProperties => {
    if (!isTransitioning && !isAnimating) {
      return {
        backgroundImage: `url(${currentBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'none',
      };
    }

    // 背景切换过渡
    const opacity = smoothValue;
    
    return {
      backgroundImage: `url(${currentBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: 1 - opacity,
      transition: 'none',
    };
  };

  // 计算下一背景的样式
  const getNextBackgroundStyles = (): React.CSSProperties => {
    if (!isTransitioning && !isAnimating) {
      return {
        display: 'none',
      };
    }

    const opacity = smoothValue;
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${nextBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity,
      zIndex: 0,
    };
  };

  // 计算内容容器的样式
  const getContentStyles = (): React.CSSProperties => {
    return {
      position: 'relative',
      zIndex: overlay ? 10 : 1,
    };
  };

  return (
    <div
      className={`background-transition-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {/* 当前背景 */}
      <div
        className="background-transition-current"
        style={getTransitionStyles()}
      />
      
      {/* 下一背景（用于过渡动画） */}
      <div
        className="background-transition-next"
        style={getNextBackgroundStyles()}
      />
      
      {/* 内容 */}
      <div
        className="background-transition-content"
        style={getContentStyles()}
      >
        {children}
      </div>
    </div>
  );
};

export default BackgroundTransition;