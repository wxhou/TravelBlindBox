import React, { useState, useEffect } from 'react';
import { X, Mountain, Building, Waves, Snowflake, Heart, Palette, RefreshCw } from 'lucide-react';
import { useWallpaperCache } from '../hooks/useWallpaperCache';
import type { ThemeCategory, WallpaperImage } from '../services/wallpaperService';

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBackground: (backgroundUrl: string) => void;
}

interface ThemeIcon {
  icon: React.ReactNode;
  color: string;
}

const themeIcons: Record<ThemeCategory, ThemeIcon> = {
  '自然风景': { icon: <Mountain className="w-6 h-6" />, color: 'text-emerald-600' },
  '城市建筑': { icon: <Building className="w-6 h-6" />, color: 'text-slate-600' },
  '水景河流': { icon: <Waves className="w-6 h-6" />, color: 'text-blue-600' },
  '冬季雪景': { icon: <Snowflake className="w-6 h-6" />, color: 'text-cyan-600' },
  '动物世界': { icon: <Heart className="w-6 h-6" />, color: 'text-rose-600' },
  '艺术文化': { icon: <Palette className="w-6 h-6" />, color: 'text-purple-600' }
};

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  isOpen,
  onClose,
  onSelectBackground
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeCategory>('自然风景');
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  
  // 使用全局缓存管理
  const {
    wallpaperData,
    loading,
    lastUpdate,
    isInitialized,
    refreshWallpapers,
    preloadImages
  } = useWallpaperCache();

  const allCategorizedWallpapers = wallpaperData || {} as Record<ThemeCategory, WallpaperImage[]>;
  const wallpapers = allCategorizedWallpapers[selectedTheme] || [];

  const handleThemeChange = (theme: ThemeCategory) => {
    setSelectedTheme(theme);
    // 切换主题时预加载该主题的图片
    if (wallpaperData && wallpaperData[theme]) {
      preloadImages(wallpaperData[theme]);
    }
  };

  const handleWallpaperSelect = (wallpaper: WallpaperImage) => {
    setSelectedWallpaper(wallpaper.url);
    onSelectBackground(wallpaper.url);
    onClose();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallpapers();
    } finally {
      setRefreshing(false);
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '刚刚更新';
    if (hours < 24) return `${hours}小时前更新`;
    return `${Math.floor(hours / 24)}天前更新`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">选择旅行背景</h2>
            <p className="text-gray-600">为您的 WANDERLUST 之旅挑选完美风景</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{formatLastUpdate(lastUpdate)}</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                title="重新分类壁纸（修复分类问题）"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? '更新中...' : '重新分类'}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {loading && (
          <div className="mx-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">正在加载壁纸...</span>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {Object.entries(themeIcons).map(([theme, { icon, color }]) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme as ThemeCategory)}
                className={`
                  flex flex-col items-center space-y-2 p-4 rounded-2xl border-2 transition-all duration-300
                  ${selectedTheme === theme 
                    ? 'border-amber-400 bg-amber-50 shadow-lg transform scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                <div className={`${color} ${selectedTheme === theme ? 'scale-110' : ''} transition-transform`}>
                  {icon}
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {theme}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {wallpapers.map((wallpaper: WallpaperImage, index: number) => (
                <div
                  key={`${wallpaper.startdate}-${index}`}
                  className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() => handleWallpaperSelect(wallpaper)}
                >
                  <div className="aspect-video relative bg-gray-200">
                    <img
                      src={wallpaper.url}
                      alt={wallpaper.copyright}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <div class="text-center text-gray-500">
                                <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-xs">图片加载失败</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-sm font-medium truncate">{wallpaper.copyright}</p>
                    </div>
                    {selectedWallpaper === wallpaper.url && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {wallpapers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">该主题暂无壁纸，请尝试其他主题</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;