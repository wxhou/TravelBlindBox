export interface WallpaperImage {
  url: string;
  copyright: string;
  title: string;
  startdate: string;
  enddate: string;
}

export interface WallpaperData {
  images: WallpaperImage[];
}

export type ThemeCategory = '自然风景' | '城市建筑' | '水景河流' | '冬季雪景' | '动物世界' | '艺术文化';

import { categorizeFallbackWallpapers } from './fallbackWallpapers';

class WallpaperService {
  private static instance: WallpaperService;
  private cache = new Map<string, WallpaperImage[]>();
  private lastUpdate = 0;
  private readonly CACHE_KEY = 'bing_wallpapers';
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟缓存
  private readonly AUTO_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24小时自动更新

  private themeMappings = [
    {
      keywords: ['landscape', 'mountain', 'forest', 'trees', 'nature', 'dawn', 'sunrise', 'sunset', 'valley', 'hills', 'spain', 'asturias', 'covadonga', 'wiltshire', 'england'],
      category: '自然风景' as ThemeCategory
    },
    {
      keywords: ['cathedral', 'city', 'building', 'architecture', 'urban', 'church', 'palace', 'castle', 'ruins', 'pier', 'salisbury'],
      category: '城市建筑' as ThemeCategory
    },
    {
      keywords: ['lake', 'river', 'water', 'ocean', 'beach', 'coastal', 'sea', 'waterfall', 'lakes', 'covadonga', 'superior'],
      category: '水景河流' as ThemeCategory
    },
    {
      keywords: ['snow', 'winter', 'snowy', 'frost', 'christmas', 'reindeer', 'snow-covered', 'snowfall', 'lapland', 'finland', 'globe', 'santa'],
      category: '冬季雪景' as ThemeCategory
    },
    {
      keywords: ['reindeer', 'wildlife', 'animals', 'bird', 'butterfly', 'starling', 'murmuration', 'brighton'],
      category: '动物世界' as ThemeCategory
    },
    {
      keywords: ['art', 'culture', 'festival', 'performance', 'museum', 'gallery', 'opera', 'ballet', 'turkish', 'nutcracker', 'ankara'],
      category: '艺术文化' as ThemeCategory
    }
  ];

  static getInstance(): WallpaperService {
    if (!WallpaperService.instance) {
      WallpaperService.instance = new WallpaperService();
    }
    return WallpaperService.instance;
  }

  private async fetchFromAPI(count: number = 15): Promise<WallpaperImage[]> {
    try {
      console.log(`🖼️ 开始获取壁纸数据，数量: ${count}`);
      
      // 使用CORS代理解决跨域问题
      const corsProxy = 'https://api.allorigins.win/get?url=';
      const bingUrl = encodeURIComponent(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=${count}&mkt=zh-CN`);
      const proxyUrl = `${corsProxy}${bingUrl}`;
      
      console.log('🌐 使用CORS代理:', proxyUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const proxyData = await response.json();
      console.log('📦 代理响应数据:', proxyData);
      
      if (!proxyData.contents) {
        throw new Error('代理响应缺少contents字段');
      }
      
      const data: WallpaperData = JSON.parse(proxyData.contents);
      
      // 检查数据结构是否正确
      if (!data.images || !Array.isArray(data.images)) {
        throw new Error('Invalid data structure');
      }

      const wallpapers: WallpaperImage[] = data.images.map(image => ({
        ...image,
        url: `https://www.bing.com${image.url}`
      }));

      console.log(`✅ 成功获取${wallpapers.length}张壁纸`);
      return wallpapers;
    } catch (error) {
      console.warn('❌ 获取壁纸失败:', error);
      
      // 区分不同类型的错误
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⏰ 请求超时');
        } else if (error.message.includes('Failed to fetch')) {
          console.warn('🌐 网络连接失败');
        } else if (error.message.includes('CORS')) {
          console.warn('🚫 CORS错误');
        }
      }
      
      // 如果API调用失败，抛出错误让上层处理
      throw error;
    }
  }

  private categorizeWallpaper(text: string, fallbackIndex: number = 0): ThemeCategory {
    const textLower = text.toLowerCase();

    // 更加精确的分类匹配
    const categoryScores = {
      '自然风景': 0,
      '城市建筑': 0,
      '水景河流': 0,
      '冬季雪景': 0,
      '动物世界': 0,
      '艺术文化': 0
    };

    // 精确匹配规则（更高权重）
    const exactMatches = {
      '冬季雪景': ['snow', 'winter', 'snowy', 'christmas', 'reindeer', 'frost', 'snowfall', 'lapland', 'finland', 'globe', 'santa'],
      '水景河流': ['lake', 'river', 'water', 'ocean', 'beach', 'coastal', 'sea', 'waterfall', 'lakes', 'superior'],
      '城市建筑': ['cathedral', 'city', 'building', 'architecture', 'urban', 'church', 'palace', 'castle', 'ruins', 'pier', 'salisbury'],
      '动物世界': ['reindeer', 'wildlife', 'animals', 'bird', 'butterfly', 'starling', 'murmuration', 'brighton'],
      '艺术文化': ['art', 'culture', 'festival', 'performance', 'opera', 'ballet', 'museum', 'gallery', 'turkish', 'nutcracker', 'ankara'],
      '自然风景': ['mountain', 'mountain', 'forest', 'trees', 'nature', 'landscape', 'dawn', 'sunrise', 'sunset', 'valley', 'hills', 'spain', 'asturias', 'covadonga', 'wiltshire', 'england']
    };

    // 计算每个分类的得分
    Object.entries(exactMatches).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          categoryScores[category as keyof typeof categoryScores] += 2; // 精确匹配得2分
        }
      });
    });

    // 查找最高得分的分类
    let bestCategory: ThemeCategory = '自然风景';
    let maxScore = 0;

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category as ThemeCategory;
      }
    });

    // 如果没有任何匹配，使用轮询方式分配到各分类，避免都堆积在第一个分类
    if (maxScore === 0) {
      const categories: ThemeCategory[] = ['自然风景', '城市建筑', '水景河流', '冬季雪景', '动物世界', '艺术文化'];
      bestCategory = categories[fallbackIndex % categories.length];
    }

    return bestCategory;
  }

  private categorizeWallpapers(wallpapers: WallpaperImage[]): Record<ThemeCategory, WallpaperImage[]> {
    const categorized: Record<ThemeCategory, WallpaperImage[]> = {
      '自然风景': [],
      '城市建筑': [],
      '水景河流': [],
      '冬季雪景': [],
      '动物世界': [],
      '艺术文化': []
    };

    wallpapers.forEach((wallpaper, index) => {
      const text = `${wallpaper.copyright} ${wallpaper.title}`;
      const category = this.categorizeWallpaper(text, index);
      categorized[category].push(wallpaper);
    });

    return categorized;
  }

  async fetchWallpapers(count: number = 15): Promise<WallpaperImage[]> {
    const cacheKey = `wallpapers_${count}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    // 检查是否需要自动更新
    if (now - this.lastUpdate > this.AUTO_UPDATE_INTERVAL) {
      this.clearCache();
    }
    
    if (cached && (now - this.lastUpdate < this.CACHE_EXPIRY)) {
      return cached;
    }

    try {
      const wallpapers = await this.fetchFromAPI(count);
      this.cache.set(cacheKey, wallpapers);
      this.lastUpdate = now;
      return wallpapers;
    } catch (error) {
      console.warn('Bing API failed, using fallback wallpapers:', error);
      // API失败时直接使用备选壁纸
      const { categorizeFallbackWallpapers } = await import('./fallbackWallpapers');
      const fallbackData = categorizeFallbackWallpapers();
      const allWallpapers = Object.values(fallbackData).flat();
      this.cache.set(cacheKey, allWallpapers);
      this.lastUpdate = now;
      return allWallpapers;
    }
  }

  async getWallpapersByTheme(theme: ThemeCategory): Promise<WallpaperImage[]> {
    try {
      const wallpapers = await this.fetchWallpapers(15);
      const categorized = this.categorizeWallpapers(wallpapers);
      return categorized[theme] || [];
    } catch (error) {
      console.warn(`Using fallback wallpapers for theme ${theme} due to API failure:`, error);
      const fallback = categorizeFallbackWallpapers();
      return fallback[theme] || [];
    }
  }

  async getAllCategorizedWallpapers(): Promise<Record<ThemeCategory, WallpaperImage[]>> {
    try {
      const wallpapers = await this.fetchWallpapers(15);
      return this.categorizeWallpapers(wallpapers);
    } catch (error) {
      console.warn('Using fallback wallpapers due to API failure:', error);
      return categorizeFallbackWallpapers();
    }
  }

  async refreshWallpapers(): Promise<void> {
    this.clearCache();
    this.lastUpdate = Date.now();
    await this.fetchWallpapers(15);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getLastUpdateTime(): number {
    return this.lastUpdate;
  }

  isAutoUpdateEnabled(): boolean {
    return Date.now() - this.lastUpdate > this.AUTO_UPDATE_INTERVAL;
  }
}

export default WallpaperService;