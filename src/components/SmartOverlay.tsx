import React from 'react';
import type { BackgroundAnalysis } from '../hooks/useBackgroundAnalysis';

interface SmartOverlayProps {
  analysis: BackgroundAnalysis | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const SmartOverlay: React.FC<SmartOverlayProps> = ({ 
  analysis, 
  children, 
  className = '',
  style = {}
}) => {
  if (!analysis) {
    return <>{children}</>;
  }

  const { isDark, overlayOpacity, textColor, contrastRatio } = analysis;

  // 计算叠加层样式
  const overlayStyles: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    transition: 'all 0.3s ease-in-out',
    background: isDark
      ? `linear-gradient(135deg, rgba(255, 255, 255, ${overlayOpacity * 0.6}) 0%, rgba(255, 255, 255, ${overlayOpacity * 0.3}) 50%, rgba(0, 0, 0, ${overlayOpacity * 0.1}) 100%)`
      : `linear-gradient(135deg, rgba(0, 0, 0, ${overlayOpacity * 0.7}) 0%, rgba(0, 0, 0, ${overlayOpacity * 0.4}) 50%, rgba(0, 0, 0, ${overlayOpacity * 0.2}) 100%)`,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    boxShadow: isDark
      ? `inset 0 0 100px rgba(255, 255, 255, ${overlayOpacity * 0.1})`
      : `inset 0 0 100px rgba(0, 0, 0, ${overlayOpacity * 0.15})`,
  };

  // 动态生成的 CSS 类名
  const textEnhancementClass = `smart-text-${textColor}-enhanced contrast-${contrastRatio < 4.5 ? 'low' : 'good'}`;

  return (
    <div 
      className={`smart-overlay ${textEnhancementClass} ${className}`}
      style={{
        ...overlayStyles,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SmartOverlay;