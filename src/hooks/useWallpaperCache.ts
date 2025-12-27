import { useState, useEffect, useCallback } from 'react';
import WallpaperService, { type ThemeCategory, type WallpaperImage } from '../services/wallpaperService';

const WALLPAPER_CACHE_KEY = 'wanderlust_wallpaper_cache';
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30分钟

interface CachedWallpaperData {
  timestamp: number;
  data: Record<ThemeCategory, WallpaperImage[]>;
}

export const useWallpaperCache = () => {
  const [wallpaperData, setWallpaperData] = useState<Record<ThemeCategory, WallpaperImage[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const wallpaperService = WallpaperService.getInstance();

  // 从localStorage加载缓存
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(WALLPAPER_CACHE_KEY);
      if (cached) {
        const parsed: CachedWallpaperData = JSON.parse(cached);
        const now = Date.now();
        
        // 检查缓存是否过期
        if (now - parsed.timestamp < CACHE_EXPIRY_TIME) {
          setWallpaperData(parsed.data);
          setLastUpdate(parsed.timestamp);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load wallpaper cache:', error);
    }
    return false;
  }, []);

  // 保存到localStorage
  const saveToCache = useCallback((data: Record<ThemeCategory, WallpaperImage[]>) => {
    try {
      const cacheData: CachedWallpaperData = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(WALLPAPER_CACHE_KEY, JSON.stringify(cacheData));
      setLastUpdate(cacheData.timestamp);
    } catch (error) {
      console.warn('Failed to save wallpaper cache:', error);
    }
  }, []);

  // 加载壁纸数据
  const loadWallpapers = useCallback(async (forceRefresh = false) => {
    // 如果已经在加载，跳过
    if (loading) return;

    setLoading(true);

    try {
      // 如果不是强制刷新，先尝试从缓存加载
      if (!forceRefresh && loadFromCache()) {
        setIsInitialized(true);
        return;
      }

      // 从API获取最新数据
      const data = await wallpaperService.getAllCategorizedWallpapers();
      setWallpaperData(data);
      saveToCache(data);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load wallpapers:', error);
      // 如果API失败，尝试使用缓存（即使过期）
      if (!loadFromCache()) {
        // 如果缓存也没有，使用备选壁纸
        const { categorizeFallbackWallpapers } = await import('../services/fallbackWallpapers');
        const fallbackData = categorizeFallbackWallpapers();
        setWallpaperData(fallbackData);
        setIsInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, loadFromCache, saveToCache, wallpaperService]);

  // 预加载图片
  const preloadImages = useCallback((wallpapers: WallpaperImage[]) => {
    wallpapers.forEach(wallpaper => {
      const img = new Image();
      img.src = wallpaper.url;
    });
  }, []);

  // 刷新壁纸
  const refreshWallpapers = useCallback(async () => {
    // 清理旧缓存
    localStorage.removeItem(WALLPAPER_CACHE_KEY);
    await loadWallpapers(true);
    // 刷新后预加载所有图片
    if (wallpaperData) {
      Object.values(wallpaperData).flat().forEach(wallpaper => {
        const img = new Image();
        img.src = wallpaper.url;
      });
    }
  }, [loadWallpapers, wallpaperData]);

  // 初始化时加载缓存
  useEffect(() => {
    if (!isInitialized) {
      loadWallpapers();
    }
  }, [isInitialized, loadWallpapers]);

  // 当壁纸数据变化时，预加载当前主题的图片
  useEffect(() => {
    if (wallpaperData) {
      // 预加载所有分类的图片
      Object.values(wallpaperData).forEach(wallpapers => {
        preloadImages(wallpapers);
      });
    }
  }, [wallpaperData, preloadImages]);

  return {
    wallpaperData,
    loading,
    lastUpdate,
    isInitialized,
    loadWallpapers,
    refreshWallpapers,
    preloadImages
  };
};

export default useWallpaperCache;