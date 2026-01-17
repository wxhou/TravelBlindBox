/**
 * 图片URL生成工具
 * 根据AI生成的 coverImageQuery 字段生成匹配的 Unsplash 图片URL
 */

// 目的地关键词到具体景点/场景的映射
const destinationImageMap: Record<string, string[]> = {
  '西安': ['西安古城墙', '兵马俑', '大雁塔', '回民街', '钟楼'],
  '北京': ['故宫', '长城', '天安门', '颐和园', '天坛'],
  '上海': ['外滩', '东方明珠', '豫园', '南京路'],
  '杭州': ['西湖', '灵隐寺', '雷峰塔', '千岛湖'],
  '成都': ['大熊猫', '武侯祠', '锦里', '都江堰'],
  '重庆': ['洪崖洞', '解放碑', '长江索道', '武隆'],
  '云南': ['丽江古城', '玉龙雪山', '洱海', '大理古城'],
  '大理': ['大理古城', '洱海', '苍山', '双廊'],
  '丽江': ['丽江古城', '玉龙雪山', '束河古镇'],
  '西藏': ['布达拉宫', '纳木错', '珠穆朗玛峰', '羊湖'],
  '拉萨': ['布达拉宫', '大昭寺', '八廓街', '纳木错'],
  '桂林': ['漓江', '阳朔', '象鼻山', '龙脊梯田'],
  '张家界': ['天门山', '武陵源', '玻璃栈道', '黄龙洞'],
  '黄山': ['黄山风景区', '迎客松', '光明顶', '西海大峡谷'],
  '青岛': ['栈桥', '八大关', '崂山', '五四广场'],
  '厦门': ['鼓浪屿', '厦门大学', '南普陀寺', '环岛路'],
  '三亚': ['亚龙湾', '天涯海角', '蜈支洲岛', '南山寺'],
  '海南': ['三亚湾', '海口', '万宁', '分界洲岛'],
  '苏州': ['拙政园', '周庄', '虎丘', '寒山寺'],
  '南京': ['中山陵', '夫子庙', '明孝陵', '南京长江大桥'],
  '武汉': ['黄鹤楼', '武汉大学', '东湖', '长江大桥'],
  '广州': ['广州塔', '陈家祠', '白云山', '珠江夜游'],
  '深圳': ['世界之窗', '东部华侨城', '深圳湾', '欢乐谷'],
  '九寨沟': ['五花海', '诺日朗瀑布', '长海', '珍珠滩'],
  '贵州': ['黄果树瀑布', '西江千户苗寨', '梵净山', '荔波'],
  '贵阳': ['甲秀楼', '青岩古镇', '黔灵山', '花果园'],
  '广西': ['桂林山水', '阳朔', '北海', '德天瀑布'],
  '湖南': ['张家界', '凤凰古城', '岳麓山', '衡山'],
  '凤凰古城': ['沱江', '吊脚楼', '虹桥', '南华山'],
  '青海': ['青海湖', '茶卡盐湖', '塔尔寺', '祁连山'],
  '西宁': ['青海湖', '塔尔寺', '日月山', '坎布拉'],
  '甘肃': ['敦煌莫高窟', '月牙泉', '嘉峪关', '张掖丹霞'],
  '敦煌': ['莫高窟', '月牙泉', '鸣沙山', '玉门关'],
  '兰州': ['黄河母亲像', '白塔山', '中山桥', '甘肃省博物馆'],
  '新疆': ['天山', '喀纳斯', '赛里木湖', '吐鲁番'],
  '乌鲁木齐': ['天山', '国际大巴扎', '南山牧场', '红山公园'],
  '西藏拉萨': ['布达拉宫', '大昭寺', '八廓街', '羊卓雍措'],
  '内蒙古': ['呼伦贝尔大草原', '锡林郭勒', '响沙湾', '成吉思汗陵'],
  '哈尔滨': ['索菲亚教堂', '中央大街', '冰雪大世界', '松花江'],
  '东北': ['长白山', '雾凇岛', '雪乡', '沈阳故宫'],
  '长春': ['伪满皇宫', '净月潭', '长影世纪城', '斯大林大街'],
  '沈阳': ['沈阳故宫', '张氏帅府', '北陵公园', '中街'],
  '山西': ['平遥古城', '云冈石窟', '五台山', '乔家大院'],
  '平遥': ['平遥古城', '古城墙', '日升昌', '县衙'],
  '河南': ['龙门石窟', '嵩山', '少林寺', '清明上河园'],
  '郑州': ['少林寺', '嵩山', '黄河风景区', '二七塔'],
  '河北': ['承德避暑山庄', '山海关', '北戴河', '清东陵'],
  '山东': ['泰山', '趵突泉', '崂山', '蓬莱阁'],
  '济南': ['趵突泉', '大明湖', '千佛山', '芙蓉街'],
  '泰山': ['泰山日出', '十八盘', '南天门', '玉皇顶'],
  '安徽': ['黄山', '宏村', '西递', '九华山'],
  '宏村': ['宏村古村落', '月沼', '南湖', '承志堂'],
  '江西': ['庐山', '婺源', '三清山', '井冈山'],
  '婺源': ['婺源油菜花', '篁岭', '晓起', '思溪延村'],
  '福建': ['武夷山', '鼓浪屿', '土楼', '厦门'],
  '武夷山': ['武夷山', '九曲溪', '天游峰', '大红袍'],
  '土楼': ['永定土楼', '南靖土楼', '田螺坑', '四菜一汤'],
  '台湾': ['台北101', '日月潭', '阿里山', '垦丁'],
  '台北': ['台北101', '故宫博物院', '士林夜市', '西门町'],
  '香港': ['维多利亚港', '太平山顶', '迪士尼', '旺角'],
  '澳门': ['大三巴', '威尼斯人', '妈阁庙', '渔人码头'],
  '四川': ['九寨沟', '峨眉山', '乐山大佛', '稻城亚丁'],
  '稻城亚丁': ['牛奶海', '五色海', '仙乃日', '央迈勇'],
  '西藏阿里': ['冈仁波齐', '玛旁雍错', '古格王朝', '扎达土林'],
  '新疆南疆': ['喀什', '帕米尔高原', '塔克拉玛干', '胡杨林'],
  '云南香格里拉': ['松赞林寺', '普达措', '蓝月谷', '独克宗'],
  '泸沽湖': ['泸沽湖', '摩梭人家', '里格半岛', '草海'],
  '西双版纳': ['傣族园', '野象谷', '热带雨林', '勐仑植物园'],
}

// 根据目的地提取图片关键词
function extractImageKeywords(query: string): string[] {
  if (!query) return []

  // 直接匹配目的地
  for (const [destination, keywords] of Object.entries(destinationImageMap)) {
    if (query.includes(destination)) {
      return keywords
    }
  }

  // 如果没有精确匹配，返回原始查询作为关键词
  return [query]
}

// 生成 Unsplash 图片URL
export function generateImageUrlFromQuery(query?: string, width: number = 800): string {
  if (!query) {
    return ''
  }

  // 提取图片关键词
  const keywords = extractImageKeywords(query)

  // 使用第一个关键词构建 Unsplash Source URL
  // Unsplash Source API 可以基于关键词随机返回图片
  const keyword = encodeURIComponent(keywords[0])

  // 使用 Unsplash 的关键词搜索URL
  // 这样可以获取与目的地更相关的图片
  return `https://source.unsplash.com/1600x900/?${keyword}&q=80&w=${width}`
}

// 检查URL是否有效（基于已知的服务）
export function isValidImageUrl(url: string): boolean {
  if (!url) return false

  const validDomains = [
    'images.unsplash.com',
    'source.unsplash.com',
    'photos.unsplash.com',
    'plus.unsplash.com',
    'picurl.cn',
    'picsum.photos',
  ]

  return validDomains.some(domain => url.includes(domain))
}

// 根据目的地主题获取备用图片索引
export function getDestinationAwareImageIndex(routeId: string, query?: string): number {
  // 目的地关键词到图片索引的映射
  const destinationToIndex: Record<string, number> = {
    // 古城/历史类 -> 图片索引 5 (古镇图片)
    '西安': 5, '北京': 5, '南京': 5, '平遥': 5, '丽江': 5, '大理': 5,
    // 自然风光 -> 图片索引 0, 1, 2 (山景/自然)
    '西藏': 0, '黄山': 0, '张家界': 0, '九寨沟': 0, '桂林': 1, '云南': 1,
    // 海岛/海滨 -> 图片索引 3, 4 (海岛/海滩)
    '三亚': 3, '海南': 3, '厦门': 3, '青岛': 3,
    // 城市夜景 -> 图片索引 9 (城市)
    '上海': 9, '重庆': 9, '广州': 9, '深圳': 9, '香港': 9,
  }

  if (query) {
    for (const [dest, index] of Object.entries(destinationToIndex)) {
      if (query.includes(dest)) {
        return index
      }
    }
  }

  // 回退到基于ID的哈希
  const hash = routeId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  return Math.abs(hash) % 10
}

// 根据目的地主题返回更匹配的备用图片
export function getThemeAwareFallbackImage(query?: string): string {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',  // 山景
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',  // 自然风光
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',  // 森林
    'https://images.unsplash.com/photo-1505142468610-179e0ef2b16d?w=800&q=80',  // 海岛
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',  // 海滩
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80',  // 海岸/古镇
    'https://images.unsplash.com/photo-1528164344705-4754268798e8?w=800&q=80',  // 古镇
    'https://images.unsplash.com/photo-1537996194471-e57df0318bd2?w=800&q=80',  // 梯田
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',  // 旅行
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',  // 公路旅行
  ]

  if (!query) {
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)]
  }

  // 根据目的地主题选择图片
  const themeMap: Record<string, number[]> = {
    // 古城/文化
    '西安': [5, 6], '北京': [5], '南京': [5], '平遥': [5, 6], '丽江': [6],
    '大理': [6], '敦煌': [0, 5], '西藏': [0, 1], '拉萨': [0, 1],
    // 自然风光
    '黄山': [0, 1], '张家界': [0, 1], '九寨沟': [1, 2], '桂林': [1],
    '云南': [1], '贵州': [2], '四川': [0, 1],
    // 海滨/海岛
    '三亚': [3, 4], '海南': [3, 4], '厦门': [3, 4], '青岛': [3, 4],
    '福建': [3, 4],
    // 城市
    '上海': [9], '重庆': [9], '广州': [9], '深圳': [9], '香港': [9],
    '杭州': [1, 9], '成都': [9], '武汉': [9], '苏州': [5, 6],
  }

  for (const [keyword, indices] of Object.entries(themeMap)) {
    if (query.includes(keyword)) {
      return fallbackImages[indices[Math.floor(Math.random() * indices.length)]]
    }
  }

  return fallbackImages[Math.floor(Math.random() * fallbackImages.length)]
}
