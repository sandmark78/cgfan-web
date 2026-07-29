'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuizOption {
  text: string
  emoji: string
  tags: string[]
}

interface QuizQuestion {
  id: number
  question: string
  options: QuizOption[]
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '你更偏爱哪种色彩氛围？',
    options: [
      { text: '单色极简', emoji: '⚪', tags: ['黑白', '单色', '留白', '极简'] },
      { text: '自然大地', emoji: '🌿', tags: ['自然', '大地色', '暖色', '东方'] },
      { text: '高饱和撞色', emoji: '🎨', tags: ['高饱和', '撞色', '鲜艳', '波普'] },
      { text: '冷调霓虹', emoji: '💜', tags: ['霓虹', '赛博朋克', '冷色', '科幻'] },
    ],
  },
  {
    id: 2,
    question: '哪种构图最让你心动？',
    options: [
      { text: '对称庄严', emoji: '🏛️', tags: ['对称', '建筑', '结构', '庄严'] },
      { text: '大量留白', emoji: '🗾', tags: ['留白', '呼吸感', '极简', '禅'] },
      { text: '特写微距', emoji: '🔍', tags: ['特写', '微距', '细节', '胶片'] },
      { text: '广角全景', emoji: '🏔️', tags: ['广角', '全景', '壮观', '风景'] },
    ],
  },
  {
    id: 3,
    question: '你希望画面传递什么情绪？',
    options: [
      { text: '安静治愈', emoji: '🕯️', tags: ['安静', '治愈', '温暖', '人间'] },
      { text: '奇幻神秘', emoji: '🌙', tags: ['奇幻', '神秘', '超现实', '梦境'] },
      { text: '故事叙事', emoji: '📖', tags: ['叙事', '电影感', '情绪', '人文'] },
      { text: '未来科幻', emoji: '🚀', tags: ['科幻', '未来', '机械', '太空'] },
    ],
  },
  {
    id: 4,
    question: '你最想收藏什么题材？',
    options: [
      { text: '自然风景', emoji: '🌊', tags: ['自然', '风景', '植物', '山', '海'] },
      { text: '城市建筑', emoji: '🌃', tags: ['城市', '建筑', '夜景', '街头'] },
      { text: '人物角色', emoji: '👤', tags: ['人物', '角色', '肖像', '动漫'] },
      { text: '微缩模型', emoji: '🧊', tags: ['微缩', '模型', '等距', '3D'] },
    ],
  },
]

// 20 种完整人格定义（与 lib/personas.ts 对齐）
interface PersonalityInfo {
  name: string
  tagline: string
  description: string
  tags: string[]
}

const ALL_PERSONALITIES: Record<string, PersonalityInfo> = {
  'light-poet': {
    name: '光影诗人',
    tagline: '你相信一束光，能讲完整个故事。',
    description: '你对光线有着天生的敏感，明暗交界处是你最爱的风景。',
    tags: ['光线', '逆光', '氛围', '光影', '电影感'],
  },
  'film-purist': {
    name: '胶片守旧派',
    tagline: '数码太干净，你偏爱那点颗粒。',
    description: '你对复古质感有着独特的偏爱，每一帧都带着时间的温度。',
    tags: ['胶片', '颗粒', '复古', '怀旧', '模拟'],
  },
  'monochromist': {
    name: '黑白默片人',
    tagline: '去掉颜色，你才看清本质。',
    description: '你相信最纯粹的美不需要色彩，光影本身就是语言。',
    tags: ['黑白', '单色', '默片', '纪实'],
  },
  'nature-gatherer': {
    name: '山野拾光人',
    tagline: '你收藏的不是图，是风、雾和光。',
    description: '你对自然有着天然的亲近感，山川湖海是你永恒的灵感来源。',
    tags: ['自然', '风景', '植物', '山', '海', '雾'],
  },
  'miniature': {
    name: '微缩造梦师',
    tagline: '你把世界装进瓶子，再还给世界。',
    description: '你是微观世界的观察者，相信伟大藏在细节里。',
    tags: ['微缩', '等距', '模型', '瓶', '玻璃'],
  },
  'decon': {
    name: '建筑解构者',
    tagline: '你在秩序里，寻找裂缝的美。',
    description: '你对空间结构有着独特的理解，在规则中寻找突破。',
    tags: ['建筑', '结构', '解构', '空间'],
  },
  'geometrist': {
    name: '几何纯粹派',
    tagline: '世界在你眼里，是圆与方的合唱。',
    description: '你追求形式的纯粹，相信数学之美就是艺术之美。',
    tags: ['几何', '抽象', '形状', '构成'],
  },
  'urban': {
    name: '都市漫游者',
    tagline: '凌晨三点的城市，是你的画廊。',
    description: '你在城市的缝隙中寻找诗意，霓虹灯下是你的舞台。',
    tags: ['城市', '夜景', '街头', '都市'],
  },
  'color-riot': {
    name: '色彩暴徒',
    tagline: '你的眼睛，容不下一点灰。',
    description: '你热爱大胆的色彩碰撞，在你的世界里，没有不敢用的颜色。',
    tags: ['高饱和', '撞色', '鲜艳', '色彩', '波普'],
  },
  'minimalist': {
    name: '留白主义者',
    tagline: '你删掉的，比你画下的更重要。',
    description: '你相信少即是多，每一寸留白都是深思熟虑的选择。',
    tags: ['极简', '留白', '单色', '禅'],
  },
  'vaporwave': {
    name: '蒸汽波旅人',
    tagline: '你活在一场永不落幕的日落里。',
    description: '你迷恋复古未来的美学，在粉紫色调中迷失自我。',
    tags: ['蒸汽波', '合成器', '复古未来', '霓虹'],
  },
  'cyber': {
    name: '赛博拾荒者',
    tagline: '你在霓虹废墟里，捡拾未来。',
    description: '你对科技与人文的碰撞着迷，在赛博世界寻找人性光芒。',
    tags: ['赛博朋克', '霓虹', '科幻', '废墟'],
  },
  'anime': {
    name: '二次元织梦人',
    tagline: '你的想象力，自带滤镜。',
    description: '你活在现实与幻想的交界处，用动漫视角重新诠释世界。',
    tags: ['动漫', '插画', '二次元', '赛璐璐', '日系'],
  },
  'surreal': {
    name: '超现实造境师',
    tagline: '你的梦，比现实更有条理。',
    description: '你擅长在现实与幻想之间架起桥梁，让不可能变得可信。',
    tags: ['超现实', '梦境', '奇幻', 'surreal'],
  },
  'dark-tale': {
    name: '暗黑童话家',
    tagline: '你的童话里，森林会吃人。',
    description: '你迷恋黑暗中的美，在诡异与优雅之间找到平衡。',
    tags: ['暗黑', '哥特', '童话', '诡异'],
  },
  'futurist': {
    name: '未来主义先知',
    tagline: '你提前看到了下一个世纪。',
    description: '你对未来充满想象，科技与艺术的融合让你着迷。',
    tags: ['未来', '科幻', '机械', '太空'],
  },
  'ukiyo': {
    name: '浮世绘匠人',
    tagline: '一笔一划，都是东方的呼吸。',
    description: '你对东方美学有着深刻的理解，传统与现代在你手中融合。',
    tags: ['浮世绘', '日系', '水墨', '传统', '东方'],
  },
  'retro': {
    name: '复古时光机',
    tagline: '你的审美，停在某个更好的年代。',
    description: '你对旧时光有着独特的眷恋，每一张老照片都是故事。',
    tags: ['复古', '怀旧', '年代', '老照片', 'vintage'],
  },
  'earthly': {
    name: '烟火人间客',
    tagline: '你爱的不是风景，是人间烟火。',
    description: '你关注日常生活中的美，在平凡中发现不平凡。',
    tags: ['人文', '街头', '食物', '生活', '市井', '烟火'],
  },
  'eclectic': {
    name: '杂食审美家',
    tagline: '你的品味没有边界，只有好奇心。',
    description: '你是开放的美学冒险家，不被任何单一风格定义。',
    tags: [],
  },
}

function determinePersonality(allTags: string[]): string {
  const tagSet = new Set(allTags)
  let bestMatch = 'eclectic'
  let bestScore = 0

  for (const [id, info] of Object.entries(ALL_PERSONALITIES)) {
    if (id === 'eclectic') continue
    const score = info.tags.filter(t => tagSet.has(t)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = id
    }
  }

  // 无明显偏好 → 杂食
  if (bestScore < 2) return 'eclectic'
  return bestMatch
}

export function AestheticQuiz() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<PersonalityInfo | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleAnswer = (tags: string[]) => {
    const newAnswers = [...answers, ...tags]
    setAnswers(newAnswers)
    setStep(step + 1)

    if (step + 1 >= QUIZ_QUESTIONS.length) {
      const personalityId = determinePersonality(newAnswers)
      const info = ALL_PERSONALITIES[personalityId]
      setResult(info)
      setShowResult(true)

      localStorage.setItem('cgfan_quiz_personality', JSON.stringify({
        id: personalityId,
        personality: info.name,
        tags: [...new Set(newAnswers)],
        timestamp: new Date().toISOString(),
      }))
    }
  }

  const handleCopy = () => {
    if (!result) return
    const text = `我的 AI 美学人格是「${result.name}」✨\n\n${result.tagline}\n\n来 CGfan 发现你的审美基因 → www.cgfan.com`
    navigator.clipboard.writeText(text)
  }

  const handleExplore = () => {
    router.push('/explore')
  }

  // 完成页
  if (showResult && result) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 text-center dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">
          你的初始美学人格
        </div>
        <h3 className="font-serif text-3xl font-black text-gray-900 dark:text-white">
          {result.name}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {result.tagline}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-500">
          {result.description}
        </p>

        <div className="mt-6 rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/40">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 收藏提示词可以完善你的美学人格，解锁更多维度
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-500 hover:shadow-lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制分享
          </button>
          <button onClick={handleExplore}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:text-gray-300">
            去收藏提示词完善 →
          </button>
        </div>
      </div>
    )
  }

  // 开始页
  if (step === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 text-center dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
        <div className="mb-4 text-5xl">🎨</div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          发现你的美学人格
        </h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          4 道题，30 秒，找到你的审美基因
        </p>
        <button onClick={() => setStep(1)}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-500 hover:shadow-lg">
          开始测试
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  // 答题中
  const currentQuestion = QUIZ_QUESTIONS[step - 1]
  if (!currentQuestion) return null

  return (
    <div>
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{step} / {QUIZ_QUESTIONS.length}</span>
          <span>第 {step} 题</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${(step / QUIZ_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 问题 */}
      <h3 className="mb-5 text-center text-lg font-bold text-gray-900 dark:text-white">
        {currentQuestion.question}
      </h3>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.text}
            onClick={() => handleAnswer(option.tags)}
            className="group flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/60 p-5 transition-all hover:border-green-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-green-500"
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
