import { useState, useEffect, useCallback } from 'react';

export interface BackgroundAnalysis {
  brightness: number; // 0-255，0为最暗，255为最亮
  isDark: boolean; // 是否为暗色背景
  overlayOpacity: number; // 建议的叠加层透明度
  textColor: 'light' | 'dark'; // 建议的文字颜色
  contrastRatio: number; // 对比度比例
}

interface UseBackgroundAnalysisReturn {
  analysis: BackgroundAnalysis | null;
  isAnalyzing: boolean;
  analyzeBackground: (backgroundUrl: string) => void;
}

export const useBackgroundAnalysis = (): UseBackgroundAnalysisReturn => {
  const [analysis, setAnalysis] = useState<BackgroundAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImageBrightness = useCallback((imageUrl: string): Promise<BackgroundAnalysis> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('无法创建canvas上下文');
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let totalBrightness = 0;
          let pixelCount = 0;

          // 每隔10个像素采样一次，提高性能
          for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 使用相对亮度公式计算亮度
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += brightness;
            pixelCount++;
          }

          const averageBrightness = totalBrightness / pixelCount;
          const isDark = averageBrightness < 128;

          // 根据亮度计算建议的叠加层透明度
          let overlayOpacity: number;
          if (isDark) {
            // 暗色背景：使用浅色叠加层
            overlayOpacity = Math.max(0.1, (128 - averageBrightness) / 128 * 0.3);
          } else {
            // 亮色背景：使用深色叠加层
            overlayOpacity = Math.max(0.2, (averageBrightness - 128) / 128 * 0.4);
          }

          // 计算对比度比例（估算）
          const contrastRatio = isDark 
            ? (255 - averageBrightness + 255) / (averageBrightness + 255)
            : (averageBrightness + 255) / (255 - averageBrightness + 255);

          const result: BackgroundAnalysis = {
            brightness: averageBrightness,
            isDark,
            overlayOpacity: Math.min(overlayOpacity, 0.6), // 最大不超过60%
            textColor: isDark ? 'light' : 'dark',
            contrastRatio: Math.round(contrastRatio * 100) / 100
          };

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = imageUrl;
    });
  }, []);

  const analyzeBackground = useCallback(async (backgroundUrl: string) => {
    if (!backgroundUrl || !backgroundUrl.startsWith('url(')) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 提取图片URL
      const urlMatch = backgroundUrl.match(/url\((.+)\)/);
      if (!urlMatch) {
        throw new Error('无效的背景URL格式');
      }

      const imageUrl = urlMatch[1].replace(/['"]/g, ''); // 移除引号
      const result = await analyzeImageBrightness(imageUrl);
      setAnalysis(result);
    } catch (error) {
      console.warn('背景亮度分析失败:', error);
      // 分析失败时提供默认配置
      setAnalysis({
        brightness: 128,
        isDark: false,
        overlayOpacity: 0.3,
        textColor: 'dark',
        contrastRatio: 3.0
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeImageBrightness]);

  return {
    analysis,
    isAnalyzing,
    analyzeBackground
  };
};

export default useBackgroundAnalysis;