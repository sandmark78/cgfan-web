/**
 * 美学人格系统 v2.0 - 36 种审美类型
 * 12 种基础人格（探索期）+ 24 种深度人格（沉浸期进化）
 * 每个基础人格进化为 3 个深度人格
 */

import { AestheticVector } from './aesthetic-engine'

export interface Persona {
  id: string
  name: string
  en: string
  nickname: string
  tagline: string
  quote?: string        // 名人名言
  description?: string  // 详细描述（可选）
  accent: string
  seal: string
  cats: Record<string, number>
  tags: string[]
  tagW?: number
  prismatic?: boolean
  deep?: boolean        // 深度人格标记
  evolvesFrom?: string  // 从哪个基础人格进化
  vector?: AestheticVector // 8维美学向量
}

export interface TasteAnalysis {
  categories: { name: string; ratio: number; count: number }[]
  topTags: { name: string; count: number }[]
  total: number
  tagSet: Set<string>
  cat: (kw: string) => number
  hasTags: (list: string[]) => number
}

// 声明式人格定义
const P = (
  id: string,
  name: string,
  en: string,
  nickname: string,
  tagline: string,
  quote: string,
  accent: string,
  seal: string,
  cats: Record<string, number>,
  tags: string[],
  vector: AestheticVector,
  tagW = 0.5,
  deep = false,
  evolvesFrom?: string
): Persona => ({ id, name, en, nickname, tagline, quote, accent, seal, cats, tags, tagW, deep, evolvesFrom, vector })

export const PERSONAS: Persona[] = [
  // ═══════════════════════════════════════
  // 基础人格（12 种）
  // ═══════════════════════════════════════

  // 1. 留白主义者
  P('minimalist', '留白主义者', 'THE MINIMALIST', 
    'MIN', '你删掉的，比你画下的更重要。',
    '"少即是多。" —— 密斯·凡德罗',
    '#D8D3C8', '留白', 
    { 抽象: 1.8 }, ['极简', '留白', '单色', '禅'],
    { complexity: 20, colorIntensity: 30, arousal: 25, fluency: 90, novelty: 40, harmony: 85, narrative: 30, stylization: 50 }),

  // 2. 光影诗人
  P('light-poet', '光影诗人', 'THE LIGHT POET', 
    'LPO', '你相信一束光，能讲完整个故事。',
    '"我们需要光，并非为了看见，而是为了感受。" —— 约翰·罗斯金',
    '#EAB308', '光影', 
    { 写实: 2, 摄影: 1 }, ['光线', '逆光', '氛围', '光影'],
    { complexity: 50, colorIntensity: 60, arousal: 65, fluency: 70, novelty: 55, harmony: 75, narrative: 80, stylization: 45 }),

  // 3. 色彩暴徒
  P('color-riot', '色彩暴徒', 'THE COLOR RIOT', 
    'CRI', '你的眼睛，容不下一点灰。',
    '"我让色彩跳舞，因为它们是我灵魂的狂欢。" —— 亨利·马蒂斯',
    '#FF4D6D', '暴徒', 
    { 抽象: 1, 动漫: 0.6 }, ['高饱和', '撞色', '鲜艳', '色彩', '波普'],
    { complexity: 70, colorIntensity: 95, arousal: 85, fluency: 50, novelty: 75, harmony: 35, narrative: 50, stylization: 65 }),

  // 4. 山野拾光人
  P('nature-gatherer', '山野拾光人', 'THE NATURE GATHERER', 
    'NGT', '你收藏的不是图，是风、雾和光。',
    '"荒野不是一种奢侈品，而是人类精神的必需品。" —— 爱德华·修威',
    '#6A994E', '拾光', 
    { 写实: 1, 摄影: 1.2 }, ['自然', '风景', '植物', '山', '海', '雾', '森林', '花'],
    { complexity: 45, colorIntensity: 55, arousal: 40, fluency: 75, novelty: 50, harmony: 85, narrative: 60, stylization: 35 }),

  // 5. 微缩造梦师
  P('miniature', '微缩造梦师', 'THE MINIATURE DREAMER', 
    'MDW', '你把世界装进瓶子，再还给世界。',
    '"一沙一世界，一花一天堂。" —— 威廉·布莱克',
    '#14B8A6', '造梦', 
    { 微缩: 2.5, '3D': 1.8, 等距视角: 1.5 }, ['微缩', '等距', '模型', '瓶', '玻璃'],
    { complexity: 85, colorIntensity: 60, arousal: 50, fluency: 65, novelty: 80, harmony: 70, narrative: 65, stylization: 75 }),

  // 6. 建筑解构者
  P('decon', '建筑解构者', 'THE DECONSTRUCTIVIST', 
    'DEC', '你在秩序里，寻找裂缝的美。',
    '"万物皆有裂痕，那是光照进来的地方。" —— 莱昂纳德·科恩',
    '#8B9DC3', '解构', 
    { 建筑: 2.2, '3D': 0.8 }, ['建筑', '结构', '解构', '空间'],
    { complexity: 70, colorIntensity: 45, arousal: 55, fluency: 60, novelty: 70, harmony: 50, narrative: 55, stylization: 70 }),

  // 7. 都市漫游者
  P('urban', '都市漫游者', 'THE URBAN WANDERER', 
    'URB', '凌晨三点的城市，是你的画廊。',
    '"漫游是都市的阅读方式，街巷就是未完结的诗篇。" —— 瓦尔特·本雅明',
    '#6B8CFF', '漫游', 
    { 摄影: 1.5, 写实: 0.8 }, ['城市', '夜景', '街头', '街', '都市'],
    { complexity: 65, colorIntensity: 70, arousal: 70, fluency: 55, novelty: 65, harmony: 50, narrative: 75, stylization: 55 }),

  // 8. 二次元织梦人
  P('anime', '二次元织梦人', 'THE ANIME WEAVER', 
    'ANM', '你的想象力，自带滤镜。',
    '"现实是用来打破的，而梦想是用来栖居的。" —— 宫崎骏',
    '#FF9770', '织梦', 
    { 动漫: 2.5 }, ['动漫', '插画', '二次元', '赛璐璐', '日系'],
    { complexity: 60, colorIntensity: 75, arousal: 75, fluency: 70, novelty: 70, harmony: 65, narrative: 80, stylization: 90 }),

  // 9. 超现实造境师
  P('surreal', '超现实造境师', 'THE SURREALIST', 
    'SUR', '你的梦，比现实更有条理。',
    '"我和疯子的唯一区别，在于我没有发疯。" —— 萨尔瓦多·达利',
    '#9B7EDE', '造境', 
    { 抽象: 1.2, 写实: 0.5 }, ['超现实', '梦境', '奇幻', 'surreal'],
    { complexity: 75, colorIntensity: 65, arousal: 80, fluency: 45, novelty: 90, harmony: 40, narrative: 85, stylization: 85 }),

  // 10. 未来主义先知
  P('futurist', '未来主义先知', 'THE FUTURIST', 
    'FUT', '你提前看到了下一个世纪。',
    '"预测未来最好的方式，就是把它创造出来。" —— 亚伦·凯',
    '#38BDF8', '先知', 
    { '3D': 1, 写实: 0.4 }, ['未来', '科幻', '机械', '太空'],
    { complexity: 80, colorIntensity: 60, arousal: 75, fluency: 55, novelty: 85, harmony: 50, narrative: 70, stylization: 80 }),

  // 11. 东方意境师
  P('eastern', '东方意境师', 'THE EASTERN MASTER', 
    'EST', '你的每一笔，都是千年的呼吸。',
    '"大音希声，大象无形。" —— 老子',
    '#DC2626', '意境', 
    { 动漫: 0.8, 写实: 0.4 }, ['浮世绘', '日系', '水墨', '传统', '东方'],
    { complexity: 40, colorIntensity: 50, arousal: 45, fluency: 80, novelty: 60, harmony: 90, narrative: 75, stylization: 70 }),

  // 12. 杂食审美家（兜底）
  P('eclectic', '杂食审美家', 'THE ECLECTIC', 
    'ECL', '你的品味没有边界，只有好奇心。',
    '"艺术不是单一的信仰，而是对世界万物无止境的狂热好奇。" —— 保罗·高更',
    '#94A3B8', '杂食', 
    {}, [],
    { complexity: 50, colorIntensity: 50, arousal: 50, fluency: 50, novelty: 50, harmony: 50, narrative: 50, stylization: 50 }),

  // ═══════════════════════════════════════
  // 深度人格（24 种）- 收藏 20+ 解锁
  // 每个基础人格进化为 3 个深度人格
  // ═══════════════════════════════════════

  // ── 1. 留白主义者 → 3 个深度 ──
  P('zen-master', '空寂大师', 'THE ZEN MASTER', 
    'ZEN', '在极致的安宁里，你听见了时间的余音。',
    '"幽暗与寂静，才是美最深沉的栖居之地。" —— 谷崎润一郎',
    '#A8A29E', '空寂', 
    { 抽象: 2.5 }, ['极简', '留白', '禅', '虚无', '本质'],
    { complexity: 10, colorIntensity: 20, arousal: 15, fluency: 95, novelty: 50, harmony: 95, narrative: 40, stylization: 60 },
    0.8, true, 'minimalist'),
  P('minimal-architect', '极简建筑师', 'THE MINIMAL ARCHITECT', 
    'MAR', '用最精简的几何，搭建最纯粹的灵魂。',
    '"好的设计是尽可能少的设计。" —— 迪特·拉姆斯',
    '#78716C', '极简', 
    { 抽象: 2, '3D': 0.8 }, ['极简', '建筑', '结构', '空间', '秩序'],
    { complexity: 30, colorIntensity: 35, arousal: 30, fluency: 85, novelty: 55, harmony: 80, narrative: 45, stylization: 65 },
    0.8, true, 'minimalist'),
  P('quiet-poet', '静谧诗人', 'THE QUIET POET', 
    'QPO', '你的画面不发一言，却回应了所有嘈杂。',
    '"在安静中，万事万物都在向你倾诉。" —— 里尔克',
    '#D6D3D1', '静谧', 
    { 抽象: 1.8, 摄影: 0.8 }, ['极简', '留白', '静谧', '诗意', '呼吸'],
    { complexity: 25, colorIntensity: 30, arousal: 20, fluency: 90, novelty: 45, harmony: 85, narrative: 70, stylization: 55 },
    0.8, true, 'minimalist'),

  // ── 2. 光影诗人 → 3 个深度 ──
  P('light-chaser', '追光者', 'THE LIGHT CHASER', 
    'LCH', '太阳每挪动一寸，都在为你重塑世界。',
    '"我终其一生，都在捕捉那转瞬即逝的明亮。" —— 克劳德·莫奈',
    '#F59E0B', '追光', 
    { 写实: 3, 摄影: 2 }, ['光线', '逆光', '黄金时刻', '丁达尔', '光晕'],
    { complexity: 55, colorIntensity: 70, arousal: 75, fluency: 65, novelty: 60, harmony: 70, narrative: 85, stylization: 50 },
    0.8, true, 'light-poet'),
  P('atmosphere-creator', '氛围营造师', 'THE ATMOSPHERE CREATOR', 
    'ACR', '你用光线的温度，悄无声息地支配情绪。',
    '"建筑不是关于砖石，而是关于气场与情绪。" —— 佩特·卒姆托',
    '#FBBF24', '氛围', 
    { 写实: 2.5, 摄影: 1.5 }, ['光线', '氛围', '雾气', '朦胧', '空气感'],
    { complexity: 50, colorIntensity: 55, arousal: 60, fluency: 75, novelty: 55, harmony: 80, narrative: 75, stylization: 40 },
    0.8, true, 'light-poet'),
  P('emotion-catcher', '情绪捕手', 'THE EMOTION CATCHER', 
    'ECA', '定格光芒落下的瞬间，就是定格永恒。',
    '"摄影是同时在一瞬间承认一个事实，并精密地组织视觉所见的形式。" —— 布列松',
    '#FCD34D', '捕手', 
    { 写实: 2, 摄影: 2 }, ['光线', '情绪', '瞬间', '故事', '氛围'],
    { complexity: 45, colorIntensity: 65, arousal: 80, fluency: 70, novelty: 60, harmony: 75, narrative: 90, stylization: 45 },
    0.8, true, 'light-poet'),

  // ── 3. 色彩暴徒 → 3 个深度 ──
  P('color-alchemist', '色彩炼金术师', 'THE COLOR ALCHEMIST', 
    'UNK', '色块交融的瞬间，你点石成金。',
    '"色彩是直接对灵魂施加影响的手段。" —— 康定斯基',
    '#E11D48', '炼金', 
    { 抽象: 2, 动漫: 1 }, ['高饱和', '撞色', '鲜艳', '色彩', '魔法'],
    { complexity: 75, colorIntensity: 98, arousal: 90, fluency: 45, novelty: 80, harmony: 30, narrative: 55, stylization: 70 },
    0.8, true, 'color-riot'),
  P('chromatic-rebel', '色谱叛逆者', 'THE CHROMATIC REBEL', 
    'UNK', '拒绝现实的平庸，用最狂野的调色板发声。',
    '"我不画事物原本的样子，我只画我对它的感受。" —— 梵高',
    '#F43F5E', '叛逆', 
    { 抽象: 1.5, 动漫: 0.8 }, ['高饱和', '撞色', '叛逆', '混乱', '秩序'],
    { complexity: 80, colorIntensity: 95, arousal: 85, fluency: 40, novelty: 85, harmony: 25, narrative: 45, stylization: 75 },
    0.8, true, 'color-riot'),
  P('neon-dreamer', '霓虹造梦者', 'THE NEON DREAMER', 
    'UNK', '在高饱和度的夜色里，你编织流光溢彩的梦。',
    '"在光与影的缝隙里，霓虹是黑夜未竟的梦境。" —— 押井守',
    '#EC4899', '霓虹', 
    { 抽象: 1.2, 动漫: 1 }, ['高饱和', '霓虹', '夜晚', '发光', '赛博'],
    { complexity: 70, colorIntensity: 90, arousal: 80, fluency: 55, novelty: 75, harmony: 35, narrative: 60, stylization: 80 },
    0.8, true, 'color-riot'),

  // ── 4. 山野拾光人 → 3 个深度 ──
  P('nature-child', '自然之子', 'CHILD OF NATURE', 
    'UNK', '你的灵魂属于大地，每一寸呼吸都顺应自然。',
    '"走进自然，就等于走回了自己。" —— 约翰·缪尔',
    '#059669', '自然', 
    { 写实: 2, 摄影: 2 }, ['自然', '风景', '植物', '山', '海', '雾', '森林', '花', '大地'],
    { complexity: 40, colorIntensity: 50, arousal: 35, fluency: 80, novelty: 55, harmony: 90, narrative: 65, stylization: 30 },
    0.8, true, 'nature-gatherer'),
  P('wilderness-poet', '荒野诗人', 'THE WILDERNESS POET', 
    'UNK', '在人迹罕至之处，你读懂了最深沉的史诗。',
    '"在荒野深处，时间不再按秒流动，而是按季节沉淀。" —— 梭罗',
    '#10B981', '荒野', 
    { 写实: 2.5, 摄影: 1.5 }, ['自然', '荒野', '无人', '大地', '孤独'],
    { complexity: 50, colorIntensity: 45, arousal: 45, fluency: 70, novelty: 60, harmony: 85, narrative: 80, stylization: 35 },
    0.8, true, 'nature-gatherer'),
  P('season-watcher', '季节观察者', 'THE SEASON WATCHER', 
    'UNK', '四时更迭的变化，就是你最奢侈的展品。',
    '"春有百花秋有月，夏有凉风冬有雪。" —— 慧开禅师',
    '#34D399', '季节', 
    { 写实: 2, 摄影: 2 }, ['自然', '季节', '时间', '叶', '变化'],
    { complexity: 55, colorIntensity: 60, arousal: 40, fluency: 75, novelty: 50, harmony: 80, narrative: 70, stylization: 40 },
    0.8, true, 'nature-gatherer'),

  // ── 5. 微缩造梦师 → 3 个深度 ──
  P('micro-creator', '微观造物主', 'THE MICRO CREATOR', 
    'UNK', '俯瞰一滴水、一颗沙，你在微观里重铸宇宙。',
    '"当你足够专注，最小的微尘里也藏着完整的宇宙。" —— 帕拉塞尔苏斯',
    '#0D9488', '造物', 
    { 微缩: 3.5, '3D': 2.5 }, ['微缩', '等距', '模型', '瓶', '玻璃', '细节', '精致'],
    { complexity: 90, colorIntensity: 65, arousal: 55, fluency: 60, novelty: 85, harmony: 75, narrative: 70, stylization: 80 },
    0.8, true, 'miniature'),
  P('miniature-storyteller', '微缩叙事者', 'THE MINIATURE STORYTELLER', 
    'UNK', '尺寸之间，藏着一整部未被讲述的传奇。',
    '"细节不仅仅是细节，它们构成了设计的整体。" —— 查尔斯·伊姆斯',
    '#14B8A6', '叙事', 
    { 微缩: 3, '3D': 2 }, ['微缩', '等距', '故事', '世界', '细节'],
    { complexity: 85, colorIntensity: 60, arousal: 50, fluency: 65, novelty: 80, harmony: 70, narrative: 85, stylization: 75 },
    0.8, true, 'miniature'),
  P('detail-hunter', '细节猎人', 'THE DETAIL HUNTER', 
    'UNK', '别人掠过的无意义角落，是你绝密的天堂。',
    '"上帝存在于细节之中。" —— 瓦尔堡',
    '#5EEAD4', '猎人', 
    { 微缩: 2.5, '3D': 2 }, ['微缩', '细节', '精致', '纹理', '观察'],
    { complexity: 80, colorIntensity: 55, arousal: 45, fluency: 70, novelty: 75, harmony: 65, narrative: 60, stylization: 70 },
    0.8, true, 'miniature'),

  // ── 6. 建筑解构者 → 3 个深度 ──
  P('space-poet', '空间诗人', 'THE SPACE POET', 
    'UNK', '你用线与面的重组，赋予空间呼吸感与诗意。',
    '"空间是诗意的盛器，光是它的语言。" —— 安藤忠雄',
    '#6366F1', '空间', 
    { 建筑: 3, '3D': 1.5 }, ['建筑', '结构', '解构', '空间', '秩序', '裂缝'],
    { complexity: 75, colorIntensity: 40, arousal: 50, fluency: 65, novelty: 75, harmony: 55, narrative: 70, stylization: 75 },
    0.8, true, 'decon'),
  P('structure-alchemist', '结构炼金师', 'THE STRUCTURE ALCHEMIST', 
    'UNK', '拆解物质的张力，在几何的交界处建立秩序。',
    '"结构是光的赋予者。" —— 路易斯·康',
    '#818CF8', '炼金', 
    { 建筑: 2.5, '3D': 2 }, ['建筑', '结构', '解构', '炼金', '转化'],
    { complexity: 80, colorIntensity: 50, arousal: 60, fluency: 60, novelty: 80, harmony: 45, narrative: 65, stylization: 80 },
    0.8, true, 'decon'),
  P('void-architect', '虚空建筑师', 'THE VOID ARCHITECT', 
    'VOA', '你不仅建造实体，更在雕刻未被占有的虚空。',
    '"建筑不应只是实体的存在，更应是空无的延展。" —— 扎哈·哈蒂德',
    '#A5B4FC', '虚空', 
    { 建筑: 2, '3D': 2.5 }, ['建筑', '结构', '虚空', '留白', '空间'],
    { complexity: 65, colorIntensity: 35, arousal: 45, fluency: 70, novelty: 70, harmony: 60, narrative: 60, stylization: 75 },
    0.8, true, 'decon'),

  // ── 7. 都市漫游者 → 3 个深度 ──
  P('city-archaeologist', '城市考古学家', 'THE CITY ARCHAEOLOGIST', 
    'UNK', '穿行于砖石与霓虹间，你发掘被遗忘的都市记忆。',
    '"城市是一本巨大的书，每一砖一瓦都是未被擦除的历史。" —— 卡尔维诺',
    '#4F46E5', '考古', 
    { 摄影: 2.5, 写实: 1.5 }, ['城市', '夜景', '街头', '街', '都市', '废墟', '遗忘'],
    { complexity: 70, colorIntensity: 65, arousal: 65, fluency: 50, novelty: 70, harmony: 45, narrative: 85, stylization: 55 },
    0.8, true, 'urban'),
  P('night-walker', '夜行者', 'THE NIGHT WALKER', 
    'NIW', '属于白昼的归白昼，你在黑夜里重拾真实的自我。',
    '"夜间的人类灵魂，比白天更为真实。" —— 狄更斯',
    '#6366F1', '夜行', 
    { 摄影: 2, 写实: 2 }, ['城市', '夜景', '街头', '夜', '孤独', '行走'],
    { complexity: 60, colorIntensity: 75, arousal: 75, fluency: 55, novelty: 65, harmony: 50, narrative: 80, stylization: 60 },
    0.8, true, 'urban'),
  P('street-philosopher', '街头哲学家', 'THE STREET PHILOSOPHER', 
    'UNK', '人潮熙攘过往，你站在街角默默解构人间百态。',
    '"街道是最好的剧场，每个人都在出演自己。" —— 薇薇安·迈尔',
    '#818CF8', '哲学', 
    { 摄影: 2, 写实: 1.5 }, ['城市', '街头', '哲学', '思考', '存在'],
    { complexity: 65, colorIntensity: 60, arousal: 60, fluency: 60, novelty: 70, harmony: 55, narrative: 90, stylization: 50 },
    0.8, true, 'urban'),

  // ── 8. 二次元织梦人 → 3 个深度 ──
  P('dimension-traveler', '次元旅行者', 'THE DIMENSION TRAVELER', 
    'UNK', '跨越现实的壁垒，你在平行世界里寻找归宿。',
    '"现实世界只是无数可能世界中的一个。" —— 莱布尼茨',
    '#EA580C', '次元', 
    { 动漫: 3.5 }, ['动漫', '插画', '二次元', '赛璐璐', '日系', '平行', '穿梭'],
    { complexity: 65, colorIntensity: 80, arousal: 80, fluency: 65, novelty: 75, harmony: 60, narrative: 85, stylization: 95 },
    0.8, true, 'anime'),
  P('anime-storyteller', '动漫叙事者', 'THE ANIME STORYTELLER', 
    'UNK', '每一道勾线与分镜，都承载着最动人的羁绊。',
    '"线条和线条交错的地方，是一个全新的世界。" —— 新海诚',
    '#F97316', '叙事', 
    { 动漫: 3 }, ['动漫', '插画', '二次元', '故事', '世界'],
    { complexity: 60, colorIntensity: 75, arousal: 70, fluency: 70, novelty: 70, harmony: 65, narrative: 95, stylization: 90 },
    0.8, true, 'anime'),
  P('cel-shade-dreamer', '赛璐璐造梦者', 'THE CEL-SHADE DREAMER', 
    'UNK', '纯粹的手绘质感，定格了永不褪色的青春理想。',
    '"帧与帧之间的间隙，是人类想象力跳跃的空间。" —— 今敏',
    '#FB923C', '赛璐', 
    { 动漫: 2.5 }, ['动漫', '插画', '二次元', '赛璐璐', '平涂'],
    { complexity: 55, colorIntensity: 70, arousal: 75, fluency: 75, novelty: 65, harmony: 70, narrative: 75, stylization: 95 },
    0.8, true, 'anime'),

  // ── 9. 超现实造境师 → 3 个深度 ──
  P('dream-architect', '梦境建筑师', 'THE DREAM ARCHITECT', 
    'UNK', '潜意识里的荒诞，在你手中构筑起严密的逻辑。',
    '"梦境是潜意识的剧场，现实不过是它的序幕。" —— 弗洛伊德',
    '#7C3AED', '筑梦', 
    { 抽象: 2, 写实: 1 }, ['超现实', '梦境', '奇幻', 'surreal', '建筑', '不可能'],
    { complexity: 80, colorIntensity: 70, arousal: 85, fluency: 40, novelty: 95, harmony: 35, narrative: 90, stylization: 90 },
    0.8, true, 'surreal'),
  P('reality-bender', '现实扭曲者', 'THE REALITY BENDER', 
    'REB', '颠覆理性的视界，你让熟悉的事物焕发荒诞之美。',
    '"这不是一只烟斗，这只是烟斗的图像。" —— 马格里特',
    '#8B5CF6', '扭曲', 
    { 抽象: 2.5, 写实: 0.8 }, ['超现实', '扭曲', '不可能', '奇幻', '梦境'],
    { complexity: 75, colorIntensity: 65, arousal: 80, fluency: 35, novelty: 95, harmony: 40, narrative: 85, stylization: 95 },
    0.8, true, 'surreal'),
  P('paradox-creator', '悖论创造者', 'THE PARADOX CREATOR', 
    'UNK', '在不可能的几何里，你铺设通往无穷的阶梯。',
    '"艺术的本质，是用不合理的秩序去重构合理的世界。" —— 埃舍尔',
    '#A78BFA', '悖论', 
    { 抽象: 2, 写实: 1.2 }, ['超现实', '悖论', '矛盾', '逻辑', '反面'],
    { complexity: 70, colorIntensity: 60, arousal: 75, fluency: 45, novelty: 90, harmony: 45, narrative: 80, stylization: 85 },
    0.8, true, 'surreal'),

  // ── 10. 未来主义先知 → 3 个深度 ──
  P('oracle', '时空预言家', 'THE ORACLE', 
    'UNK', '站在时间轴的两端，你注视着沧海桑田的变迁。',
    '"时间不是流逝的，是我们穿越了它。" —— 爱因斯坦',
    '#0284C7', '预言', 
    { '3D': 1.5, 写实: 0.8 }, ['未来', '科幻', '机械', '太空', '预言', '看见'],
    { complexity: 85, colorIntensity: 65, arousal: 80, fluency: 50, novelty: 90, harmony: 45, narrative: 75, stylization: 85 },
    0.8, true, 'futurist'),
  P('cyber-architect', '赛博建筑师', 'THE CYBER ARCHITECT', 
    'CYA', '钢铁与数据交织，你构建数字时代的视觉神殿。',
    '"未来早已到来，只是分布得不太均匀。" —— 威廉·吉布森',
    '#0EA5E9', '赛博', 
    { '3D': 2, 写实: 0.6 }, ['未来', '科幻', '赛博', '建筑', '代码'],
    { complexity: 85, colorIntensity: 70, arousal: 75, fluency: 55, novelty: 85, harmony: 50, narrative: 70, stylization: 85 },
    0.8, true, 'futurist'),
  P('space-explorer', '太空探索者', 'THE SPACE EXPLORER', 
    'SPE', '你的目光穿透大气层，停留在星辰大海的彼岸。',
    '"地球是人类的摇篮，但人不能永远生活在摇篮里。" —— 齐奥尔科夫斯基',
    '#38BDF8', '太空', 
    { '3D': 1.8, 写实: 0.5 }, ['未来', '科幻', '太空', '探索', '光年'],
    { complexity: 75, colorIntensity: 55, arousal: 70, fluency: 60, novelty: 90, harmony: 55, narrative: 65, stylization: 80 },
    0.8, true, 'futurist'),

  // ── 11. 东方意境师 → 3 个深度 ──
  P('ink-master', '水墨宗师', 'THE INK MASTER', 
    'INM', '浓淡干湿之间，墨晕散开即是一整个江湖。',
    '"运墨如用兵，水晕墨章，不设色而五色俱备。" —— 张彦远',
    '#DC2626', '水墨', 
    { 动漫: 1, 写实: 0.6 }, ['水墨', '东方', '传统', '笔', '墨'],
    { complexity: 45, colorIntensity: 40, arousal: 40, fluency: 85, novelty: 65, harmony: 95, narrative: 80, stylization: 75 },
    0.8, true, 'eastern'),
  P('zen-gardener', '禅意园丁', 'THE ZEN GARDENER', 
    'UNK', '一石一木皆是修行，静观天地自在圆融。',
    '"一石一沙皆有禅，不着一字尽得风流。" —— 梦窗疏石',
    '#EF4444', '禅意', 
    { 动漫: 0.8, 写实: 0.8 }, ['东方', '禅', '意境', '心境', '留白'],
    { complexity: 35, colorIntensity: 45, arousal: 35, fluency: 85, novelty: 55, harmony: 95, narrative: 75, stylization: 70 },
    0.8, true, 'eastern'),
  P('ukiyo-spirit', '浮世之魂', 'THE UKIYO SPIRIT', 
    'UNK', '游走于红尘喧嚣，你把瞬息万变的人生定格成画。',
    '"活在当下，赏月、观雪、看樱花，这就是浮世的美。" —— 浅井了意',
    '#F87171', '浮世', 
    { 动漫: 1.2, 写实: 0.5 }, ['浮世绘', '东方', '传统', '灵魂', '浮世'],
    { complexity: 50, colorIntensity: 55, arousal: 50, fluency: 75, novelty: 70, harmony: 85, narrative: 80, stylization: 80 },
    0.8, true, 'eastern'),

  // ── 12. 杂食审美家 → 3 个深度（特殊进化） ──
  P('aesthetic-explorer', '美学探险家', 'THE AESTHETIC EXPLORER', 
    'UNK', '踏入未知的美学领地，每一次发现都是一次狂欢。',
    '"美无处不在，对于我们的眼睛，不是缺少美，而是缺少发现。" —— 罗丹',
    '#64748B', '探险', 
    { 摄影: 1, 写实: 1, 抽象: 1 }, ['多元', '探索', '未知', '发现', '美'],
    { complexity: 55, colorIntensity: 55, arousal: 55, fluency: 55, novelty: 70, harmony: 55, narrative: 55, stylization: 55 },
    0.8, true, 'eclectic'),
  P('style-mixer', '风格混搭师', 'THE STYLE MIXER', 
    'STM', '打碎传统的框架，将碰撞与对立熔炼成独一无二的品味。',
    '"风格是矛盾的集合，是不同时空的完美相撞。" —— 伊夫·圣罗兰',
    '#94A3B8', '混搭', 
    { 摄影: 0.8, 抽象: 1.2 }, ['多元', '混搭', '融合', '创新', '可能'],
    { complexity: 60, colorIntensity: 60, arousal: 60, fluency: 50, novelty: 75, harmony: 50, narrative: 55, stylization: 65 },
    0.8, true, 'eclectic'),
  P('border-breaker', '边界打破者', 'THE BORDER BREAKER', 
    'UNK', '没有定义能束缚你，你本身就是规则的改写者。',
    '"一切艺术形式的终点，都是打破固有规则的界限。" —— 毕加索',
    '#CBD5E1', '破界', 
    { 摄影: 1, 抽象: 1, '3D': 0.8 }, ['多元', '边界', '打破', '自由', '无界'],
    { complexity: 65, colorIntensity: 65, arousal: 65, fluency: 45, novelty: 80, harmony: 45, narrative: 60, stylization: 70 },
    0.8, true, 'eclectic'),
]

// 杂食审美家特殊标记
export const ECLECTIC = PERSONAS.find(p => p.id === 'eclectic')!
ECLECTIC.prismatic = true

// 基础人格（12 种）
export const BASE_PERSONAS = PERSONAS.filter(p => !p.deep)
// 深度人格（24 种）
export const DEEP_PERSONAS = PERSONAS.filter(p => p.deep)

// 进化规则
export const EVOLUTION_MAP: Record<string, string[]> = {
  'minimalist': ['zen-master', 'minimal-architect', 'quiet-poet'],
  'light-poet': ['light-chaser', 'atmosphere-creator', 'emotion-catcher'],
  'color-riot': ['color-alchemist', 'chromatic-rebel', 'neon-dreamer'],
  'nature-gatherer': ['nature-child', 'wilderness-poet', 'season-watcher'],
  'miniature': ['micro-creator', 'miniature-storyteller', 'detail-hunter'],
  'decon': ['space-poet', 'structure-alchemist', 'void-architect'],
  'urban': ['city-archaeologist', 'night-walker', 'street-philosopher'],
  'anime': ['dimension-traveler', 'anime-storyteller', 'cel-shade-dreamer'],
  'surreal': ['dream-architect', 'reality-bender', 'paradox-creator'],
  'futurist': ['oracle', 'cyber-architect', 'space-explorer'],
  'eastern': ['ink-master', 'zen-gardener', 'ukiyo-spirit'],
  'eclectic': ['aesthetic-explorer', 'style-mixer', 'border-breaker'],
}

// 统一打分
function score(p: Persona, a: TasteAnalysis): number {
  let s = 0
  for (const [kw, w] of Object.entries(p.cats)) {
    s += a.cat(kw) * w
  }
  s += p.tags.filter(t => a.tagSet.has(t)).length * (p.tagW || 0.5)
  return s
}

/**
 * 匹配人格 - 根据收藏数量和偏好深度决定基础/深度人格
 */
export function matchPersona(a: TasteAnalysis): Persona {
  const ranked = PERSONAS
    .filter(p => p.id !== 'eclectic')
    .map(p => ({ p, s: score(p, a) }))
    .sort((x, y) => y.s - x.s)

  const top = ranked[0]
  // 无主导分类 且 无明确标签信号 → 杂食
  if (!top || top.s < 1.0 || (a.categories[0]?.ratio ?? 0) < 0.3) return ECLECTIC

  // 收藏不足 20 条时，只匹配基础人格
  if (a.total < 20) {
    const baseRanked = ranked.filter(r => !r.p.deep)
    const baseTop = baseRanked[0]
    if (!baseTop || baseTop.s < 1.0) return ECLECTIC
    return baseTop.p
  }

  return top.p
}

/**
 * 匹配深度人格（收藏 20+ 时调用）
 */
export function matchDeepPersona(a: TasteAnalysis): Persona | null {
  if (a.total < 20) return null

  const deepRanked = DEEP_PERSONAS
    .map(p => ({ p, s: score(p, a) }))
    .sort((x, y) => y.s - x.s)

  const top = deepRanked[0]
  if (!top || top.s < 2.0) return null
  return top.p
}

export function rankPersonas(a: TasteAnalysis, n = 2): Persona[] {
  return PERSONAS
    .filter(p => p.id !== 'eclectic')
    .map(p => ({ p, s: score(p, a) }))
    .sort((x, y) => y.s - x.s)
    .slice(0, n)
    .map(r => r.p)
}
