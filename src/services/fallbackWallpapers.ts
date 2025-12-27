import type { WallpaperImage } from './wallpaperService';

// 默认壁纸备选方案
export const fallbackWallpapers: WallpaperImage[] = [
  // 自然风景
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "壮丽的山景 (© Unsplash)",
    title: "Mountain Landscape",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "神秘的森林 (© Unsplash)",
    title: "Forest",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "山谷日出 (© Unsplash)",
    title: "Valley Sunrise",
    startdate: "20241226",
    enddate: "20241227"
  },
  
  // 城市建筑
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "城市天际线 (© Unsplash)",
    title: "City Skyline",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2116&q=80",
    copyright: "现代建筑 (© Unsplash)",
    title: "Modern Architecture",
    startdate: "20241226",
    enddate: "20241227"
  },
  
  // 水景河流
  {
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2025&q=80",
    copyright: "宁静的湖景 (© Unsplash)",
    title: "Lake View",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "夕阳下的海滩 (© Unsplash)",
    title: "Beach Sunset",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "瀑布景观 (© Unsplash)",
    title: "Waterfall",
    startdate: "20241226",
    enddate: "20241227"
  },
  
  // 冬季雪景
  {
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2025&q=80",
    copyright: "雪景中的小屋 (© Unsplash)",
    title: "Winter Cabin",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "雪花纷飞 (© Unsplash)",
    title: "Snowy Landscape",
    startdate: "20241226",
    enddate: "20241227"
  },
  
  // 动物世界
  {
    url: "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2063&q=80",
    copyright: "可爱的动物 (© Unsplash)",
    title: "Cute Animals",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "野生鸟类 (© Unsplash)",
    title: "Wild Birds",
    startdate: "20241226",
    enddate: "20241227"
  },
  
  // 艺术文化
  {
    url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "艺术馆 (© Unsplash)",
    title: "Art Gallery",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    copyright: "文化表演 (© Unsplash)",
    title: "Cultural Performance",
    startdate: "20241226",
    enddate: "20241227"
  }
];

export function categorizeFallbackWallpapers() {
  return {
    '自然风景': [
      fallbackWallpapers[0], // 壮丽的山景
      fallbackWallpapers[1], // 神秘的森林
      fallbackWallpapers[2], // 山谷日出
    ],
    '城市建筑': [
      fallbackWallpapers[3], // 城市天际线
      fallbackWallpapers[4], // 现代建筑
    ],
    '水景河流': [
      fallbackWallpapers[5], // 宁静的湖景
      fallbackWallpapers[6], // 夕阳下的海滩
      fallbackWallpapers[7], // 瀑布景观
    ],
    '冬季雪景': [
      fallbackWallpapers[8], // 雪景中的小屋
      fallbackWallpapers[9], // 雪花纷飞
    ],
    '动物世界': [
      fallbackWallpapers[10], // 可爱的动物
      fallbackWallpapers[11], // 野生鸟类
    ],
    '艺术文化': [
      fallbackWallpapers[12], // 艺术馆
      fallbackWallpapers[13], // 文化表演
    ]
  };
}