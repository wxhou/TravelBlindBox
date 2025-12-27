import React, { useState, useEffect, useRef } from 'react';
import type { BackgroundAnalysis } from '../hooks/useBackgroundAnalysis';

interface VisualDesignConfig {
  theme: 'auto' | 'light' | 'dark' | 'dynamic';
  enableGlassmorphism: boolean;
  enableNeumorphism: boolean;
  enableParallax: boolean;
  enableMicroInteractions: boolean;
  colorScheme: 'default' | 'warm' | 'cool' | 'monochrome' | 'vibrant';
  animationStyle: 'subtle' | 'moderate' | 'dramatic';
}

interface VisualDesignEnhancerProps {
  analysis: BackgroundAnalysis | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  config?: Partial<VisualDesignConfig>;
}

const defaultConfig: VisualDesignConfig = {
  theme: 'auto',
  enableGlassmorphism: true,
  enableNeumorphism: false,
  enableParallax: true,
  enableMicroInteractions: true,
  colorScheme: 'default',
  animationStyle: 'subtle',
};

const VisualDesignEnhancer: React.FC<VisualDesignEnhancerProps> = ({
  analysis,
  children,
  className = '',
  style = {},
  config = {},
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [theme, setTheme] = useState(finalConfig.theme);
  const containerRef = useRef<HTMLDivElement>(null);

  // 动态主题检测
  useEffect(() => {
    if (finalConfig.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mediaQuery.matches ? 'dark' : 'light');
      
      mediaQuery.addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      });
    } else {
      setTheme(finalConfig.theme);
    }
  }, [finalConfig.theme]);

  // 鼠标位置追踪
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  // 生成动态样式
  const getVisualStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      ...style,
      position: 'relative',
      overflow: 'hidden',
    };

    // 毛玻璃效果
    if (finalConfig.enableGlassmorphism) {
      styles.background = theme === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.2)';
      styles.backdropFilter = 'blur(20px) saturate(180%)';
      styles.WebkitBackdropFilter = 'blur(20px) saturate(180%)';
      styles.border = '1px solid rgba(255, 255, 255, 0.2)';
    }

    // 新拟态效果
    if (finalConfig.enableNeumorphism) {
      if (theme === 'dark') {
        styles.background = '#1a1a1a';
        styles.boxShadow = `
          20px 20px 60px #0d0d0d,
          -20px -20px 60px #272727,
          inset 5px 5px 10px rgba(255, 255, 255, 0.1),
          inset -5px -5px 10px rgba(0, 0, 0, 0.3)
        `;
      } else {
        styles.background = '#f0f0f0';
        styles.boxShadow = `
          20px 20px 60px #d1d1d1,
          -20px -20px 60px #ffffff,
          inset 5px 5px 10px rgba(255, 255, 255, 0.8),
          inset -5px -5px 10px rgba(0, 0, 0, 0.1)
        `;
      }
    }

    // 视差效果
    if (finalConfig.enableParallax) {
      const parallaxX = (mousePosition.x - 50) * 0.1;
      const parallaxY = (mousePosition.y - 50) * 0.1;
      
      styles.transform = `translate(${parallaxX}px, ${parallaxY}px)`;
      styles.transition = 'transform 0.3s ease-out';
    }

    // 微交互效果
    if (finalConfig.enableMicroInteractions && isHovered) {
      styles.transform = 'scale(1.02)';
      styles.boxShadow = theme === 'dark'
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      styles.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    return styles;
  };

  // 生成动态颜色方案
  const getColorScheme = () => {
    const baseColors = {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };

    switch (finalConfig.colorScheme) {
      case 'warm':
        return {
          ...baseColors,
          primary: '#f97316',
          secondary: '#dc2626',
          accent: '#eab308',
        };
      case 'cool':
        return {
          ...baseColors,
          primary: '#0ea5e9',
          secondary: '#6366f1',
          accent: '#14b8a6',
        };
      case 'monochrome':
        return {
          primary: '#374151',
          secondary: '#6b7280',
          accent: '#9ca3af',
          success: '#4b5563',
          warning: '#6b7280',
          error: '#374151',
        };
      case 'vibrant':
        return {
          primary: '#ec4899',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        };
      default:
        return baseColors;
    }
  };

  // 生成动态类名
  const getVisualClasses = (): string => {
    const classes = ['visual-design-enhancer', `theme-${theme}`, `color-${finalConfig.colorScheme}`];
    
    if (finalConfig.enableGlassmorphism) classes.push('glassmorphism');
    if (finalConfig.enableNeumorphism) classes.push('neumorphism');
    if (finalConfig.enableParallax) classes.push('parallax');
    if (finalConfig.enableMicroInteractions) classes.push('micro-interactions');
    if (isHovered) classes.push('hovered');
    
    return `${classes.join(' ')} ${className}`.trim();
  };

  // 渲染装饰性元素
  const renderDecorativeElements = () => {
    if (finalConfig.animationStyle === 'subtle') return null;

    return (
      <>
        {/* 浮动几何图形 */}
        <div className="floating-shapes">
          <div 
            className="shape shape-1"
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '60px',
              height: '60px',
              background: `linear-gradient(45deg, ${getColorScheme().primary}40, ${getColorScheme().secondary}40)`,
              borderRadius: '50%',
              animation: finalConfig.animationStyle === 'dramatic' ? 'float 6s ease-in-out infinite' : 'none',
              opacity: 0.6,
            }}
          />
          <div 
            className="shape shape-2"
            style={{
              position: 'absolute',
              top: '60%',
              right: '15%',
              width: '40px',
              height: '40px',
              background: `linear-gradient(45deg, ${getColorScheme().accent}40, ${getColorScheme().success}40)`,
              borderRadius: '20% 80% 60% 40% / 30% 10% 90% 70%',
              animation: finalConfig.animationStyle === 'dramatic' ? 'float 8s ease-in-out infinite reverse' : 'none',
              opacity: 0.4,
            }}
          />
          <div 
            className="shape shape-3"
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '20%',
              width: '80px',
              height: '80px',
              background: `linear-gradient(45deg, ${getColorScheme().warning}40, ${getColorScheme().error}40)`,
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              animation: finalConfig.animationStyle === 'dramatic' ? 'float 10s ease-in-out infinite' : 'none',
              opacity: 0.3,
            }}
          />
        </div>

        {/* 渐变光晕效果 */}
        {finalConfig.animationStyle === 'dramatic' && (
          <div 
            className="gradient-glow"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${getColorScheme().primary}20 0%, transparent 70%)`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'pulse 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    );
  };

  const colorScheme = getColorScheme();

  return (
    <div
      ref={containerRef}
      className={getVisualClasses()}
      style={getVisualStyles()}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 装饰性元素 */}
      {renderDecorativeElements()}
      
      {/* 内容容器 */}
      <div
        className="visual-content"
        style={{
          position: 'relative',
          zIndex: 1,
          color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
        }}
      >
        {children}
      </div>

      {/* 动态样式变量 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .visual-design-enhancer {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .visual-design-enhancer.hovered {
          transform: scale(1.02);
        }
        
        /* 颜色主题变量 */
        .theme-light {
          --color-primary: ${colorScheme.primary};
          --color-secondary: ${colorScheme.secondary};
          --color-accent: ${colorScheme.accent};
          --color-success: ${colorScheme.success};
          --color-warning: ${colorScheme.warning};
          --color-error: ${colorScheme.error};
        }
        
        .theme-dark {
          --color-primary: ${colorScheme.primary};
          --color-secondary: ${colorScheme.secondary};
          --color-accent: ${colorScheme.accent};
          --color-success: ${colorScheme.success};
          --color-warning: ${colorScheme.warning};
          --color-error: ${colorScheme.error};
        }
      `}</style>
    </div>
  );
};

export default VisualDesignEnhancer;