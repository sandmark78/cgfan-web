/**
 * 美学人格系统 - 36 种审美类型
 * 20 种基础人格（探索期）+ 16 种深度人格（沉浸期进化）
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
  deep?: boolean        // 深度人格标记
  evolvesFrom?: string  // 从哪个基础人格进化
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
  tagW = 0.5,
  deep = false,
  evolvesFrom?: string
): Persona => ({ id, name, en, tagline, accent, seal, cats, tags, tagW, deep, evolvesFrom })

export const PERSONAS: Persona[] = [
  // ═══════════════════════════════════════
  // 基础人格（20 种）
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // 深度人格（16 种）- 收藏 20+ 解锁
  // ═══════════════════════════════════════

  // ── 光与影进化 ──
  P('light-chaser', '追光者', 'THE LIGHT CHASER', '你不只是看光，你在追逐光的方向。', '#F59E0B', '追光', { 写实: 3, 摄影: 2 }, ['光线', '逆光', '黄金时刻', '丁达尔', '光晕'], 0.8, true, 'light-poet'),
  P('darkroom', '暗房守望者', 'THE DARKROOM KEEPER', '你在显影液里，等待时间凝固。', '#78716C', '暗房', { 摄影: 2.5, 写实: 1.5 }, ['胶片', '颗粒', '暗房', '银盐', '模拟'], 0.8, true, 'film-purist'),

  // ── 自然与空间进化 ──
  P('nature-child', '自然之子', 'CHILD OF NATURE', '你与万物同频，风是你的语言。', '#059669', '自然', { 写实: 2, 摄影: 2 }, ['自然', '风景', '植物', '山', '海', '雾', '森林', '花', '大地'], 0.8, true, 'nature-gatherer'),
  P('space-poet', '空间诗人', 'THE SPACE POET', '你用建筑写诗，用空间叙事。', '#6366F1', '空间', { 建筑: 3, '3D': 1.5 }, ['建筑', '结构', '解构', '空间', '秩序', '裂缝'], 0.8, true, 'decon'),
  P('micro-creator', '微观造物主', 'THE MICRO CREATOR', '你在针尖上建造宇宙。', '#0D9488', '造物', { 微缩: 3.5, '3D': 2.5 }, ['微缩', '等距', '模型', '瓶', '玻璃', '细节', '精致'], 0.8, true, 'miniature'),
  P('form-alchemist', '形式炼金师', 'THE FORM ALCHEMIST', '你把形状炼成黄金。', '#2563EB', '炼金', { 抽象: 3, '3D': 1 }, ['几何', '抽象', '形状', '构成', '纯粹', '数学'], 0.8, true, 'geometrist'),

  // ── 城市与色彩进化 ──
  P('city-archaeologist', '城市考古学家', 'THE CITY ARCHAEOLOGIST', '你在街角挖掘被遗忘的故事。', '#4F46E5', '考古', { 摄影: 2.5, 写实: 1.5 }, ['城市', '夜景', '街头', '街', '都市', '废墟', '遗忘'], 0.8, true, 'urban'),
  P('color-alchemist', '色彩炼金术师', 'THE COLOR ALCHEMIST', '你把颜色炼成魔法。', '#E11D48', '炼金', { 抽象: 2, 动漫: 1 }, ['高饱和', '撞色', '鲜艳', '色彩', '波普', '魔法'], 0.8, true, 'color-riot'),
  P('time-traveler', '时光旅人', 'THE TIME TRAVELER', '你在时间的褶皱里寻找永恒。', '#DB2777', '旅人', { 抽象: 1.5, 动漫: 1 }, ['蒸汽波', '合成器', '复古未来', '霓虹', '永恒', '褶皱'], 0.8, true, 'vaporwave'),
  P('future-archaeologist', '未来考古学家', 'THE FUTURE ARCHAEOLOGIST', '你从未来挖掘现在的遗迹。', '#06B6D4', '考古', { '3D': 1.5, 写实: 1 }, ['赛博朋克', '霓虹', '科幻', '废墟', '遗迹', '未来'], 0.8, true, 'cyber'),

  // ── 幻想与叙事进化 ──
  P('dimension-traveler', '次元旅行者', 'THE DIMENSION TRAVELER', '你在平行宇宙间自由穿梭。', '#EA580C', '次元', { 动漫: 3.5 }, ['动漫', '插画', '二次元', '赛璐璐', '日系', '平行', '穿梭'], 0.8, true, 'anime'),
  P('dream-architect', '梦境建筑师', 'THE DREAM ARCHITECT', '你用想象力建造不可能的建筑。', '#7C3AED', '筑梦', { 抽象: 2, 写实: 1 }, ['超现实', '梦境', '奇幻', 'surreal', '建筑', '不可能'], 0.8, true, 'surreal'),
  P('abyss-narrator', '深渊叙事者', 'THE ABYSS NARRATOR', '你在黑暗中讲述最温柔的故事。', '#991B1B', '深渊', { 写实: 1, 抽象: 1 }, ['暗黑', '哥特', '童话', '诡异', '森林', '深渊', '温柔'], 0.8, true, 'dark-tale'),
  P('oracle', '时空预言家', 'THE ORACLE', '你看见了所有人还没看见的未来。', '#0284C7', '预言', { '3D': 1.5, 写实: 0.8 }, ['未来', '科幻', '机械', '太空', '预言', '看见'], 0.8, true, 'futurist'),

  // ── 东方与时光进化 ──
  P('eastern-master', '东方意境师', 'THE EASTERN MASTER', '你的每一笔，都是千年的呼吸。', '#DC2626', '意境', { 动漫: 1.2, 写实: 0.8 }, ['浮世绘', '日系', '水墨', '传统', '东方', '意境', '千年'], 0.8, true, 'ukiyo'),
  P('nostalgia-keeper', '时光收藏家', 'THE NOSTALGIA KEEPER', '你收藏的不是旧物，是旧时光里的温度。', '#92400E', '收藏', { 写实: 1.5, 摄影: 1.5 }, ['复古', '怀旧', '年代', '老照片', 'vintage', '温度', '旧物'], 0.8, true, 'retro'),
]

// 杂食审美家特殊标记
export const ECLECTIC = PERSONAS.find(p => p.id === 'eclectic')!
ECLECTIC.prismatic = true

// 基础人格
export const BASE_PERSONAS = PERSONAS.filter(p => !p.deep)
// 深度人格
export const DEEP_PERSONAS = PERSONAS.filter(p => p.deep)

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
