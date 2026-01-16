import type { WallpaperImage } from './wallpaperService';

// 默认壁纸备选方案 - 每个分类至少3张
export const fallbackWallpapers: WallpaperImage[] = [
  // ========== 自然风景 (6张) ==========
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    copyright: "壮丽的山景 (© Unsplash)",
    title: "Mountain Landscape",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80",
    copyright: "神秘的森林 (© Unsplash)",
    title: "Forest",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
    copyright: "山谷日出 (© Unsplash)",
    title: "Valley Sunrise",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80",
    copyright: "雪山之巅 (© Unsplash)",
    title: "Snow Mountain Peak",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    copyright: "金色草原 (© Unsplash)",
    title: "Golden Grassland",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    copyright: "壮美山脉 (© Unsplash)",
    title: "Magnificent Mountains",
    startdate: "20241226",
    enddate: "20241227"
  },

  // ========== 城市建筑 (4张) ==========
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
    copyright: "城市天际线 (© Unsplash)",
    title: "City Skyline",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80",
    copyright: "现代建筑 (© Unsplash)",
    title: "Modern Architecture",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80",
    copyright: "纽约都市 (© Unsplash)",
    title: "New York City",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1520250491945-b93c5eb6308c?w=1200&q=80",
    copyright: "古镇风情 (© Unsplash)",
    title: "Ancient Town",
    startdate: "20241226",
    enddate: "20241227"
  },

  // ========== 水景河流 (4张) ==========
  {
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&q=80",
    copyright: "宁静的湖景 (© Unsplash)",
    title: "Lake View",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&q=80",
    copyright: "夕阳下的海滩 (© Unsplash)",
    title: "Beach Sunset",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&q=80",
    copyright: "瀑布景观 (© Unsplash)",
    title: "Waterfall",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80",
    copyright: "海岸线 (© Unsplash)",
    title: "Coastline",
    startdate: "20241226",
    enddate: "20241227"
  },

  // ========== 冬季雪景 (4张) ==========
  {
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80",
    copyright: "雪景中的小屋 (© Unsplash)",
    title: "Winter Cabin",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=1200&q=80",
    copyright: "雪花纷飞 (© Unsplash)",
    title: "Snowy Landscape",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1457269449834-928af640684d?w=1200&q=80",
    copyright: "雪松林 (© Unsplash)",
    title: "Snowy Pines",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1483664852095-d6cc6870705d?w=1200&q=80",
    copyright: "冬季森林 (© Unsplash)",
    title: "Winter Forest",
    startdate: "20241226",
    enddate: "20241227"
  },

  // ========== 动物世界 (4张) ==========
  {
    url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80",
    copyright: "可爱的动物 (© Unsplash)",
    title: "Cute Animals",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1200&q=80",
    copyright: "野生鸟类 (© Unsplash)",
    title: "Wild Birds",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1200&q=80",
    copyright: "狐狸 (© Unsplash)",
    title: "Fox",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=1200&q=80",
    copyright: "海龟 (© Unsplash)",
    title: "Sea Turtle",
    startdate: "20241226",
    enddate: "20241227"
  },

  // ========== 艺术文化 (4张) ==========
  {
    url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
    copyright: "艺术馆 (© Unsplash)",
    title: "Art Gallery",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
    copyright: "文化表演 (© Unsplash)",
    title: "Cultural Performance",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1200&q=80",
    copyright: "剧院灯光 (© Unsplash)",
    title: "Theater Lights",
    startdate: "20241226",
    enddate: "20241227"
  },
  {
    url: "https://images.unsplash.com/photo-1467806919852-69d2a337e713?w=1200&q=80",
    copyright: "博物馆 (© Unsplash)",
    title: "Museum",
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
      fallbackWallpapers[3], // 雪山之巅
      fallbackWallpapers[4], // 金色草原
      fallbackWallpapers[5], // 壮美山脉
    ],
    '城市建筑': [
      fallbackWallpapers[6], // 城市天际线
      fallbackWallpapers[7], // 现代建筑
      fallbackWallpapers[8], // 纽约都市
      fallbackWallpapers[9], // 古镇风情
    ],
    '水景河流': [
      fallbackWallpapers[10], // 宁静的湖景
      fallbackWallpapers[11], // 夕阳下的海滩
      fallbackWallpapers[12], // 瀑布景观
      fallbackWallpapers[13], // 海岸线
    ],
    '冬季雪景': [
      fallbackWallpapers[14], // 雪景中的小屋
      fallbackWallpapers[15], // 雪花纷飞
      fallbackWallpapers[16], // 雪松林
      fallbackWallpapers[17], // 冬季森林
    ],
    '动物世界': [
      fallbackWallpapers[18], // 可爱的动物
      fallbackWallpapers[19], // 野生鸟类
      fallbackWallpapers[20], // 狐狸
      fallbackWallpapers[21], // 海龟
    ],
    '艺术文化': [
      fallbackWallpapers[22], // 艺术馆
      fallbackWallpapers[23], // 文化表演
      fallbackWallpapers[24], // 剧院灯光
      fallbackWallpapers[25], // 博物馆
    ]
  };
}
