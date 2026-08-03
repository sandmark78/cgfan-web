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
    date: '2026-08-03',
    slug: 'prompt-2079921414392660223',
    curatorNote: '这条提示词最犀利的地方在于把纸雕的物理层叠感与东方幻想的叙事深度焊死在一起。它不只是描述画面，而是用「顶部标题区—中部圆形焦点—下方通道」的三段式构图模板，强制生成具有展览级气质的海报。色彩限定在深蓝、暖金、米白、朱砂红，克制中透出高级感。特别适合需要快速产出高质量概念海报的AIGC创作者，尤其是山海经、国风神话等主题，能有效避免画面松散和AI低质感。',
    highlight: '三段式纸雕构图模板，让AI海报直接拥有展览级气质。',
    technique: '纸雕层叠 · 中轴对称构图 · 克制色系 · 书法标题排版',
    tip: '利用「顶部标题区+中部圆形焦点+下方通道」的固定结构，可大幅降低AI自由发挥的随机性，确保画面紧凑且气场统一。',
    tryChange: '将纸雕材质改为「珐琅彩绘」或「金属蚀刻」，保留原有构图和色彩，能瞬间切换成另一种东方高级质感。',
  },
  
  
  
  {
    date: '2026-08-02',
    slug: 'prompt-2083190950470557941',
    curatorNote: '唐风美学CG人像的完整范式。从人物设定（狭长凤眼、含情眼神、胭脂唇色）到造型设计（精工凤冠、珍珠流苏材质反光），再到光影系统（暖金主光聚焦面部、冷色辅光塑造体积、边缘光勾勒发丝轮廓），三层递进构建出「含蓄东方美」的情绪张力。色彩体系用胭脂粉+鎏金为主色、冷青蓝灰为辅色，低饱和高质感避免艳俗。',
    highlight: '85mm f1.4浅景深 + 柔焦辉光 + 胶片颗粒，三重质感叠加营造盛唐旧梦氛围',
    technique: '唐风美学 · CG写实人像 · 电影级布光',
    tip: '用 "caustic light refraction" 替代 "柔焦辉光" 可以获得更锐利的珠宝折射光效，适合突出凤冠宝石细节。',
    tryChange: '把「胭脂粉+鎏金」换成「靛蓝+银白」，观察从盛唐华丽到宋瓷清冷的氛围转变。',
  },
  {
    date: '2026-08-01',
    slug: 'prompt-2083028260385112169',
    curatorNote: '这个 prompt 的问题在于「大而全」——既想写人像又想写建筑，既想写胶片又想写数字崩坏，结果每个元素都只是点到为止。真正的教训是：AI 提示词需要「聚焦一个核心」。比如只写 Brutalist architecture 的碎片化崩坏，或者只写 Jennifer Lawrence 的街拍人像，不要混在一起。代码里能看到两个完全不同的 Midjourney prompt 用 --sref 73575448 绑在一起，但风格差异太大，sref 也救不了。',
    highlight: '提示词需要聚焦，不要大而全',
    technique: '人像摄影 · 建筑摄影 · 风格统一',
    tip: '写 prompt 时遵循「一个场景一个核心」原则。想拍人像就只写人像（人物+服装+情绪+光线），想拍建筑就只写建筑（材质+结构+环境），不要混。--sref 统一风格的前提是主体一致，否则风格参考会互相打架。',
    tryChange: '把两个场景拆成两个独立 prompt：第一个只写 Brutalist architecture 的崩坏碎片（去掉人像元素），用 --ar 16:9；第二个只写 Jennifer Lawrence 的街拍人像（去掉建筑元素），用 --ar 9:16。各跑一次对比，你会发现分开后每张图都更干净。',
  },
  {
    date: '2026-07-31',
    slug: 'prompt-2082436485740118403',
    curatorNote: 'Chinoiserie（中国风）的教科书级示范。这个 prompt 的精髓在于「材质叙事」：青花瓷鸟笼（porcelain birdcages）+ 金属装饰（ornate）+ 植物（wisteria, camellias, bamboo）三层材质叠加，让 AI 理解这不是简单的「中国元素堆砌」，而是有工艺逻辑的空间构建。色彩控制精准：ivory（象牙白）做底、jade（玉绿）提气、cobalt（钴蓝）点睛、gold（金）收边——四色构建出「雅而不寡」的东方调性。构图上 foreground birdcages → midground flowers → background trailing wisteria 三层递进，形成真正的「温室」纵深感。',
    highlight: 'Chinoiserie 的材质叙事与四色构建',
    technique: 'Chinoiserie 风格 · 材质分层 · 四色控制',
    tip: "写东方美学 prompt 时，用 'Chinoiserie' 比 'Chinese style' 精准十倍——前者是西方艺术史对东方工艺的特定理解，自带 'delicate brushwork' 和 'intricate details' 的视觉基因。色彩不要写 'soft colors'，要具体到材质名：'ivory, jade, cobalt, gold' 比 'white, green, blue, yellow' 多出工艺感和文化重量。",
    tryChange: "把 'soft ivory, jade, cobalt, and gold tones' 换成 'muted celadon, vermillion, and antique bronze'，整张图会从「清宫雅趣」变成「文人案头」——色彩性格决定东方美学的朝代气质。",
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
      '复古未来主义旅行海报的教科书级示范。这个 prompt 的核心技巧在于「材质模拟」——用 "risograph print" 触发 AI 对孔版印刷的视觉记忆，自动叠加套色不准的错位感和油墨颗粒质感，比笼统的 "retro poster" 精准十倍。配色策略是「有限调色板」哲学：只选 teal（青绿）和 orange（暖橙）两个主色，通过明度变化构建层次，反而比堆砌十几种颜色更有设计感。字体处理上，"bold sans-serif typography" 配合 "slight texture overlay" 让文字既有现代感又融入复古氛围。构图采用经典的「中心对称 + 放射状元素」，视觉焦点清晰，信息层级分明。这个 prompt 证明了：限制是创意的催化剂，越克制越有味道。',
    highlight: '限制配色，反而更有味道',
    technique: '孔版印刷 · 有限配色 · 矢量排版',
    tip: '"risograph print" 是复古海报的核武器——它让 AI 模拟孔版印刷的套色不准和颗粒感，比直接写 "retro style" 精准十倍。',
    tryChange: '把配色从 "teal + orange" 换成 "red + cream"，整张海报的时代感会从 60 年代跳到 80 年代。',
  },
  {
    date: '2026-07-23',
    slug: '3d-capsule-toy-kawaii-diorama',
    curatorNote:
      '3D 胶囊玩具风格的城市微缩场景，这个 prompt 展示了「可爱美学」与「都市感」的完美结合。核心技巧在于「移轴摄影模拟」——用 "tilt-shift photography" 触发 AI 对微缩模型拍摄手法的理解，自动产生浅景深和焦点压缩效果，让真实城市场景看起来像精致的玩具模型。材质处理上，"plastic texture" 和 "glossy finish" 赋予建筑表面玩具般的质感和光泽，配合 "soft ambient occlusion" 营造出柔和的阴影过渡。配色采用高饱和度的糖果色系，但通过 "pastel tones" 降低明度对比，避免过于刺眼。构图上 "isometric view" 等距视角让画面具有游戏场景的视觉特征，信息层级清晰。这个 prompt 的精髓在于：用摄影技法模拟实体玩具的视觉特征，而不是简单地堆砌 "cute" 和 "kawaii" 关键词。',
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
