/**
 * 每日一味 - 策展数据
 * 每天推荐一个 prompt，附带策展笔记
 */

export interface DailyFeature {
  date: string // YYYY-MM-DD
  slug: string
  curatorNote: string
  highlight?: string // 一句话亮点
  tip?: string // 实用技巧
  technique?: string // 关键技法
  tryChange?: string // 试着改一个词
}

/**
 * 每日一味映射表
 * 格式：日期 -> { slug, 策展笔记, 亮点 }
 */
export const dailyFeatures: DailyFeature[] = [
  {
    date: '2026-07-31',
    slug: 'prompt-2082436485740118403',
    curatorNote: '这个提示词展示了 AI 图像生成的创意可能性。',
    highlight: '中国风温室：青花瓷鸟笼花鸟构图...',
    technique: 'editorial · AI绘图',
    tip: "具体的描述比抽象的形容更有效，用 'neon red chaise lounge' 而不是 'colorful furniture'。",
    tryChange: '把提示词中的颜色或材质描述换成对比色/对比材质，观察整体氛围的变化。',
  },
  {
    date: '2026-07-30',
    slug: 'prompt-2078116052224131219',
    curatorNote: '东方禅意美学的极致表达。玉青、玫红、暖白三色构建出「花影入庭」的诗意场景，大量留白与极简构图完美诠释了「少即是多」的设计哲学。提示词中对光线、材质、氛围的精准控制，让 AI 生成出具有东方水墨韵味的现代壁纸。',
    highlight: '东方禅意壁纸：花影入庭',
    technique: '东方美学 · 极简留白 · 有限配色',
    tip: '东方美学的核心是「留白」和「意境」。用「玉青」「暖白」等具体色彩词，配合「禅意」「诗意」等氛围词，比笼统的「中国风」更有效。',
    tryChange: '把「花影入庭」换成「月照松间」，从春日温婉转为秋夜清冷，观察色彩和氛围的变化。',
  },
  {
    date: '2026-07-29',
    slug: 'prompt-2081696877125480627',
    curatorNote:
      '东方美学PPT课件设计——把「念奴娇·赤壁」从文字解析变成视觉叙事。这个 prompt 的精髓在于「字体即图形」：中文主标题纵向重组、字距拉伸、局部叠压，让文字既承担信息功能又成为核心图形。设计体系融合了东方留白美学、宋式雅正秩序、瑞士国际主义网格，引用了原研哉、田中一光、杉浦康平、Josef Müller-Brockmann 的美学方法。配色遵循低饱和主调、冷暖微对比、明度层级分区，用单一高纯度强调色（朱红）打破克制。构图采用中轴对称、黄金分割、模块化网格，让信息呈现出建筑般的秩序和呼吸感。',
    highlight: '字体即图形，信息即叙事',
    technique: '东方留白 · 瑞士网格 · 字体排版即图形',
    tip: '写东方美学 prompt 时，不要只写「中国风」——太模糊。要具体到设计体系：「宋式雅正秩序」「瑞士国际主义网格」「低饱和主调+单一高纯度强调」。引用设计师名字（原研哉、田中一光、杉浦康平）比写「东方美学」精准十倍。字体处理要写「纵向重组、字距拉伸、局部叠压」，让 AI 理解文字是图形不是装饰。',
    tryChange: '把主题从「念奴娇·赤壁」换成「水调歌头·明月几时有」，从豪放派的壮阔变成婉约派的空灵，视觉从「中轴对称+朱红强调」变成「偏心构图+月白留白」',
  },
  {
    date: '2026-07-28',
    slug: 'chinese-paper-cut-art',
    curatorNote:
      '中式古典立体剪纸——把非遗剪纸从平面升级为三维纸雕空间。这个 prompt 的精髓在于"通用框架"设计：用【人物角色】【故事主题】【主花卉】【主色调】四个可替换参数，让同一套技法能生成无限变体。层次结构上，从人物服饰的镂空纹样（祥云、缠枝、如意）→ 头饰的纸艺转化（步摇、珠翠变镂空结构）→ 背景的场景构建（月洞门、花窗、远山），三层递进形成真正的"立体"感。光线处理是点睛之笔——"从纸雕镂空缝隙和不同纸层之间轻柔透出"，让光成为雕刻刀，比单纯描述形状高级一个维度。',
    highlight: '非遗剪纸的三维空间转化',
    technique: '镂空透光 · 参数化框架 · 多层纸雕',
    tip: '写工艺类 prompt 时，不要只描述"看起来像什么"，要描述"光怎么穿过材质"。"光线从镂空缝隙透出形成自然阴影"比"精致的剪纸"多出十倍空间感。配合"浮雕厚度"和"多层空间关系"，让 AI 理解这是立体结构而非平面贴图。',
    tryChange: '把"柔和月光、灯笼暖光"换成"正午硬光、强阴影"，整张纸雕从古典雅致变成现代极简，光线性格决定作品情绪',
  },
  {
    date: '2026-07-27',
    slug: 'retro-futuristic-desert',
    curatorNote:
      '复古未来主义沙漠加油站——80年代肌肉车停在外星加油站，chrome 油泵反射霓虹红光，远处是冰封海洋和双月牙。这个 prompt 的精髓在于分层叙事：前景（人+车+油泵）→ 中景（沙漠公路+电线杆）→ 远景（冰封山脉+双月+外星巨构）。色彩上 deep teal 天空渐变 warm orange 日落，配合 neon red chrome 反射，是 Outrun 色板的教科书级应用。引用了 Syd Mead、Moebius、Blade Runner 三个视觉基因，让 AI 精准锁定复古科幻的调性。',
    highlight: '外星公路上的最后一个加油站',
    technique: 'Outrun 色板 · 分层叙事 · chrome 反射',
    tip: '复古科幻的核武器是三个名字：Syd Mead（银翼杀手概念设计）、Moebius（环境插画）、Blade Runner（氛围）。直接写 "retro sci-fi" AI 会跑偏，但写上这三个名字，调性瞬间锁定。再配合 "Kodak Ektachrome 100 film look" 模拟胶片颗粒感，整张图就有了 80 年代科幻电影海报的质感。',
    tryChange: '把 "deep teal sky fading into warm orange sunset" 换成 "deep purple sky with aurora borealis"，整张图会从 Outrun 暖调变成北欧冷调科幻',
  },
  {
    date: '2026-07-26',
    slug: 'prompt-2080985898653565196',
    curatorNote:
      'AI 小说封面生成框架——不是给一个 prompt，而是给一套从故事内核到视觉叙事的完整方法论。这个框架把小说封面拆解为：标题字体选择、主视觉构图、色彩情绪、作者名排版四个层次。GPT-Image 2 的理解力足以处理这种结构化指令，每一层都可以独立调整而不影响整体。',
    highlight: '从故事内核到视觉叙事的完整方法论',
    technique: '结构化指令 · 分层设计 · GPT-Image2',
    tip: '写封面 prompt 时，不要一上来就描述画面。先定义「情绪基调」（dark/gothic/warm），再定义「构图层次」（前景主体/中景氛围/远景留白），最后才是具体的视觉元素。分层写比堆砌关键词有效十倍。',
    tryChange: '把色彩情绪从 "dark gothic" 换成 "warm nostalgic"，同一套框架立刻从悬疑惊悚变成治愈系文学',
  },
  {
    date: '2026-07-25',
    slug: 'bottle-city-miniature',
    curatorNote:
      '这个 prompt 的灵感来自日本"箱庭"微缩艺术。作者试了 14 次才把玻璃瓶的折射感调对，关键是把 "subsurface scattering" 换成 "caustic light refraction"——一个词的差别，光就活了。',
    highlight: '一个词的差别，光就活了',
    technique: '焦散光 · 微距 · 暖冷对比',
    tip: '写玻璃材质时，避免用 "transparent"——太普通。用 "caustic light refraction" 或 "light dispersion through glass" 会让模型自动计算光的折射路径。',
    tryChange: '把 "warm sunset" 换成 "cold morning"，整座城的情绪会完全不同',
  },
  {
    date: '2026-07-24',
    slug: 'retro-futuristic-vector-travel-poster',
    curatorNote:
      '复古未来主义旅行海报。关键技巧：用 "risograph print" 模拟孔版印刷的颗粒感，配合 "limited color palette" 限制配色，反而比堆砌细节更有味道。',
    highlight: '限制配色，反而更有味道',
    technique: '孔版印刷 · 有限配色 · 矢量排版',
    tip: '"risograph print" 是复古海报的核武器——它让 AI 模拟孔版印刷的套色不准和颗粒感，比直接写 "retro style" 精准十倍。',
    tryChange: '把配色从 "teal + orange" 换成 "red + cream"，整张海报的时代感会从 60 年代跳到 80 年代。',
  },
  {
    date: '2026-07-23',
    slug: '3d-capsule-toy-kawaii-diorama',
    curatorNote:
      '3D 胶囊玩具风格的城市微缩场景。这个 prompt 的精髓在于 "kawaii urban diorama"——把可爱和都市感结合，用 tilt-shift 镜头营造微缩模型的错觉。',
    highlight: '可爱与都市的完美融合',
    technique: '移轴摄影 · 微缩模型 · 日系可爱',
    tip: '想做出"玩具感"的关键词是 "tilt-shift" 和 "macro photography"——前者模拟微缩模型的景深错觉，后者让细节放大到像真的在拍一个实体模型。',
    tryChange: '把 "sunny day" 换成 "rainy night"，城市微缩从玩具店橱窗变成赛博朋克街机。',
  },
]

/**
 * 获取今日推荐
 */
export function getTodayFeature(): DailyFeature | null {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return dailyFeatures.find((f) => f.date === today) || null
}

/**
 * 获取指定日期的推荐
 */
export function getFeatureByDate(date: string): DailyFeature | null {
  return dailyFeatures.find((f) => f.date === date) || null
}

/**
 * 获取所有每日一味（按日期降序）
 */
export function getAllFeatures(): DailyFeature[] {
  return [...dailyFeatures].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * 获取昨天的推荐
 */
export function getYesterdayFeature(): DailyFeature | null {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  return getFeatureByDate(dateStr)
}

/**
 * 获取明天的推荐（如果有的话）
 */
export function getTomorrowFeature(): DailyFeature | null {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]
  return getFeatureByDate(dateStr)
}
