import React from 'react';
import type { BackgroundAnalysis } from '../hooks/useBackgroundAnalysis';

interface TextEnhancerProps {
  analysis: BackgroundAnalysis | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  level?: 'minimal' | 'standard' | 'enhanced' | 'maximum';
  enableStroke?: boolean;
  enableGlow?: boolean;
}

const TextEnhancer: React.FC<TextEnhancerProps> = ({
  analysis,
  children,
  className = '',
  style = {},
  level = 'standard',
  enableStroke = true,
  enableGlow = true,
}) => {
  if (!analysis) {
    return <>{children}</>;
  }

  const { isDark, overlayOpacity, textColor, contrastRatio } = analysis;

  // 计算增强级别
  const getEnhancementLevel = (): string => {
    const baseLevel = level;
    if (contrastRatio < 3) return 'maximum';
    if (contrastRatio < 4.5) return 'enhanced';
    return baseLevel;
  };

  const currentLevel = getEnhancementLevel();

  // 计算文字样式
  const getTextStyles = (): React.CSSProperties => {
    const textStyles: React.CSSProperties = {
      transition: 'all 0.3s ease-in-out',
      color: textColor === 'light' ? '#ffffff' : '#1a1a1a',
    };

    const shadowStrength = Math.min(overlayOpacity * 2, 1);
    const baseShadow = textColor === 'light'
      ? `0 1px 3px rgba(0, 0, 0, ${0.5 + shadowStrength * 0.3})`
      : `0 1px 3px rgba(255, 255, 255, ${0.6 + shadowStrength * 0.3})`;

    switch (currentLevel) {
      case 'minimal':
        textStyles.textShadow = baseShadow;
        break;
      case 'standard':
        textStyles.textShadow = `
          ${baseShadow},
          0 2px 6px ${textColor === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'}
        `;
        break;
      case 'enhanced':
        textStyles.textShadow = `
          ${baseShadow},
          0 2px 6px ${textColor === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'},
          0 4px 12px ${textColor === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'}
        `;
        if (enableStroke && contrastRatio < 4.5) {
          textStyles.WebkitTextStroke = textColor === 'light'
            ? '0.5px rgba(0, 0, 0, 0.7)'
            : '0.5px rgba(255, 255, 255, 0.8)';
        }
        break;
      case 'maximum':
        textStyles.textShadow = `
          ${baseShadow},
          0 2px 6px ${textColor === 'light' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)'},
          0 4px 12px ${textColor === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'},
          0 8px 24px ${textColor === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'}
        `;
        if (enableStroke) {
          textStyles.WebkitTextStroke = textColor === 'light'
            ? '1px rgba(0, 0, 0, 0.8)'
            : '1px rgba(255, 255, 255, 0.9)';
        }
        if (enableGlow) {
          textStyles.filter = textColor === 'light'
            ? `drop-shadow(0 0 10px rgba(255, 255, 255, ${0.3 + shadowStrength * 0.3}))`
            : `drop-shadow(0 0 10px rgba(0, 0, 0, ${0.3 + shadowStrength * 0.3}))`;
        }
        break;
    }

    return textStyles;
  };

  // 生成动态类名
  const getDynamicClasses = (): string => {
    const classes = ['text-enhancer', `level-${currentLevel}`];
    
    if (textColor === 'light') classes.push('text-light');
    if (textColor === 'dark') classes.push('text-dark');
    
    if (enableStroke && contrastRatio < 4.5) classes.push('has-stroke');
    if (enableGlow && currentLevel === 'maximum') classes.push('has-glow');
    
    return `${classes.join(' ')} ${className}`.trim();
  };

  return (
    <span
      className={getDynamicClasses()}
      style={{
        ...style,
        ...getTextStyles(),
      }}
    >
      {children}
    </span>
  );
};

export default TextEnhancer;