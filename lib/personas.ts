/**
 * 美学人格系统 - 20 种审美类型
 */

export interface Persona {
  id: string
  name: string
  en: string
  tagline: string
  accent: string
  seal: string
  cats: Record<string, number>
  tags: string[]
  tagW?: number
  prismatic?: boolean
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
  tagline: string,
  accent: string,
  seal: string,
  cats: Record<string, number>,
  tags: string[],
  tagW = 0.5
): Persona => ({ id, name, en, tagline, accent, seal, cats, tags, tagW })

export const PERSONAS: Persona[] = [
  // ── 光与影 ──
  P('light-poet', '光影诗人', 'THE LIGHT POET', '你相信一束光，能讲完整个故事。', '#EAB308', '光影', { 写实: 2, 摄影: 1 }, ['光线', '逆光', '氛围', '光影']),
  P('film-purist', '胶片守旧派', 'THE FILM PURIST', '数码太干净，你偏爱那点颗粒。', '#9C8468', '守旧', { 摄影: 1.5, 写实: 1 }, ['胶片', '颗粒', '模拟', '胶片颗粒']),
  P('monochromist', '黑白默片人', 'THE MONOCHROMIST', '去掉颜色，你才看清本质。', '#C7C7C7', '黑白', { 摄影: 1.5, 抽象: 0.8 }, ['黑白', '单色', '默片', '纪实']),
  P('nature-gatherer', '山野拾光人', 'THE NATURE GATHERER', '你收藏的不是图，是风、雾和光。', '#6A994E', '拾光', { 写实: 1, 摄影: 1.2 }, ['自然', '风景', '植物', '山', '海', '雾', '森林', '花']),

  // ── 空间与结构 ──
  P('miniature', '微缩造梦师', 'THE MINIATURE DREAMER', '你把世界装进瓶子，再还给世界。', '#14B8A6', '造梦', { 微缩: 2.5, '3D': 1.8, 等距视角: 1.5 }, ['微缩', '等距', '模型', '瓶', '玻璃']),
  P('decon', '建筑解构者', 'THE DECONSTRUCTIVIST', '你在秩序里，寻找裂缝的美。', '#8B9DC3', '解构', { 建筑: 2.2, '3D': 0.8 }, ['建筑', '结构', '解构', '空间']),
  P('geometrist', '几何纯粹派', 'THE GEOMETRIST', '世界在你眼里，是圆与方的合唱。', '#1D4ED8', '几何', { 抽象: 2, '3D': 0.6 }, ['几何', '抽象', '形状', '构成']),
  P('urban', '都市漫游者', 'THE URBAN WANDERER', '凌晨三点的城市，是你的画廊。', '#6B8CFF', '漫游', { 摄影: 1.5, 写实: 0.8 }, ['城市', '夜景', '街头', '街', '都市']),

  // ── 色彩与情绪 ──
  P('color-riot', '色彩暴徒', 'THE COLOR RIOT', '你的眼睛，容不下一点灰。', '#FF4D6D', '暴徒', { 抽象: 1, 动漫: 0.6 }, ['高饱和', '撞色', '鲜艳', '色彩', '波普']),
  P('minimalist', '留白主义者', 'THE MINIMALIST', '你删掉的，比你画下的更重要。', '#D8D3C8', '留白', { 抽象: 1.8 }, ['极简', '留白', '单色', '禅']),
  P('vaporwave', '蒸汽波旅人', 'THE VAPORWAVE DRIFTER', '你活在一场永不落幕的日落里。', '#F472B6', '蒸汽', { 抽象: 0.8, 动漫: 0.6 }, ['蒸汽波', '合成器', '复古未来', '霓虹']),
  P('cyber', '赛博拾荒者', 'THE CYBER SCAVENGER', '你在霓虹废墟里，捡拾未来。', '#00E5FF', '拾荒', { '3D': 0.8, 写实: 0.5 }, ['赛博朋克', '霓虹', '科幻', '废墟']),

  // ── 幻想与叙事 ──
  P('anime', '二次元织梦人', 'THE ANIME WEAVER', '你的想象力，自带滤镜。', '#FF9770', '织梦', { 动漫: 2.5 }, ['动漫', '插画', '二次元', '赛璐璐', '日系']),
  P('surreal', '超现实造境师', 'THE SURREALIST', '你的梦，比现实更有条理。', '#9B7EDE', '造境', { 抽象: 1.2, 写实: 0.5 }, ['超现实', '梦境', '奇幻', 'surreal']),
  P('dark-tale', '暗黑童话家', 'THE DARK STORYTELLER', '你的童话里，森林会吃人。', '#8E3B46', '暗黑', { 写实: 0.5, 抽象: 0.6 }, ['暗黑', '哥特', '童话', '诡异', '森林']),
  P('futurist', '未来主义先知', 'THE FUTURIST', '你提前看到了下一个世纪。', '#38BDF8', '先知', { '3D': 1, 写实: 0.4 }, ['未来', '科幻', '机械', '太空']),

  // ── 东方与时光 ──
  P('ukiyo', '浮世绘匠人', 'THE UKIYO-E ARTISAN', '一笔一划，都是东方的呼吸。', '#D0442E', '浮世', { 动漫: 0.8, 写实: 0.4 }, ['浮世绘', '日系', '水墨', '传统', '东方']),
  P('retro', '复古时光机', 'THE RETRO TRAVELER', '你的审美，停在某个更好的年代。', '#B45309', '复古', { 写实: 0.8, 摄影: 0.8 }, ['复古', '怀旧', '年代', '老照片', 'vintage']),
  P('earthly', '烟火人间客', 'THE EARTHLY OBSERVER', '你爱的不是风景，是人间烟火。', '#F97316', '烟火', { 摄影: 1.3, 写实: 0.8 }, ['人文', '街头', '食物', '生活', '市井', '烟火']),

  // ── 兜底 ──
  P('eclectic', '杂食审美家', 'THE ECLECTIC', '你的品味没有边界，只有好奇心。', '#94A3B8', '杂食', {}, []),
]

// 杂食审美家特殊标记
export const ECLECTIC = PERSONAS.find(p => p.id === 'eclectic')!
ECLECTIC.prismatic = true

// 统一打分
function score(p: Persona, a: TasteAnalysis): number {
  let s = 0
  for (const [kw, w] of Object.entries(p.cats)) {
    s += a.cat(kw) * w
  }
  s += p.tags.filter(t => a.tagSet.has(t)).length * (p.tagW || 0.5)
  return s
}

export function matchPersona(a: TasteAnalysis): Persona {
  const ranked = PERSONAS
    .filter(p => p.id !== 'eclectic')
    .map(p => ({ p, s: score(p, a) }))
    .sort((x, y) => y.s - x.s)

  const top = ranked[0]
  // 无主导分类 且 无明确标签信号 → 杂食
  if (!top || top.s < 1.0 || (a.categories[0]?.ratio ?? 0) < 0.3) return ECLECTIC
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
