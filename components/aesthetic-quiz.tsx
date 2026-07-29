'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuizQuestion {
  id: number
  question: string
  options: {
    text: string
    emoji: string
    tags: string[]
  }[]
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '你更偏爱哪种色彩氛围？',
    options: [
      { text: '大地暖色', emoji: '🌅', tags: ['暖色', '自然', '大地色'] },
      { text: '冷蓝灰调', emoji: '🌊', tags: ['冷色', '极简', '电影感'] },
      { text: '高饱和撞色', emoji: '🎨', tags: ['高饱和', '撞色', '波普'] },
      { text: '黑白单色', emoji: '⚪', tags: ['黑白', '单色', '极简'] },
    ],
  },
  {
    id: 2,
    question: '哪种构图最让你心动？',
    options: [
      { text: '大量留白', emoji: '🗾', tags: ['留白', '极简', '呼吸感'] },
      { text: '对称庄严', emoji: '🏛️', tags: ['对称', '庄严', '建筑感'] },
      { text: '特写细节', emoji: '🔍', tags: ['特写', '微距', '细节'] },
      { text: '广角全景', emoji: '🏔️', tags: ['广角', '全景', '壮观'] },
    ],
  },
  {
    id: 3,
    question: '你希望画面传递什么情绪？',
    options: [
      { text: '安静治愈', emoji: '🕯️', tags: ['安静', '治愈', '温暖'] },
      { text: '奇幻神秘', emoji: '🌙', tags: ['奇幻', '神秘', '超现实'] },
      { text: '故事叙事', emoji: '📖', tags: ['叙事', '电影感', '情绪'] },
      { text: '未来科幻', emoji: '🚀', tags: ['科幻', '未来', '赛博朋克'] },
    ],
  },
]

const PERSONALITY_MAP: Record<string, { name: string; tagline: string; description: string }> = {
  '留白主义者': {
    name: '留白主义者',
    tagline: '你删掉的，比你画下的更重要。',
    description: '你相信少即是多，每一寸留白都是深思熟虑的选择。'
  },
  '光影诗人': {
    name: '光影诗人',
    tagline: '你相信一束光，能讲完整个故事。',
    description: '你对光线有着天生的敏感，明暗交界处是你最爱的风景。'
  },
  '色彩暴徒': {
    name: '色彩暴徒',
    tagline: '你的眼睛，容不下一点灰。',
    description: '你热爱大胆的色彩碰撞，在你的世界里，没有不敢用的颜色。'
  },
  '超现实造境师': {
    name: '超现实造境师',
    tagline: '你的梦，比现实更有条理。',
    description: '你擅长在现实与幻想之间架起桥梁，让不可能变得可信。'
  },
  '山野拾光人': {
    name: '山野拾光人',
    tagline: '你收藏的不是图，是风、雾和光。',
    description: '你对自然有着天然的亲近感，山川湖海是你永恒的灵感来源。'
  },
  '未来主义先知': {
    name: '未来主义先知',
    tagline: '你提前看到了下一个世纪。',
    description: '你对未来充满想象，科技与人文的碰撞让你着迷。'
  },
  '胶片守旧派': {
    name: '胶片守旧派',
    tagline: '数码太干净，你偏爱那点颗粒。',
    description: '你对复古质感有着独特的偏爱，每一帧都带着时间的温度。'
  },
  '美学探索者': {
    name: '美学探索者',
    tagline: '你的品味没有边界，只有好奇心。',
    description: '你是开放的美学冒险家，不被任何单一风格定义。'
  },
}

function determinePersonality(tags: string[]): string {
  const tagSet = new Set(tags)
  
  if (tagSet.has('留白') || tagSet.has('极简')) return '留白主义者'
  if (tagSet.has('暖色') || tagSet.has('自然')) return '山野拾光人'
  if (tagSet.has('冷色') || tagSet.has('电影感')) return '光影诗人'
  if (tagSet.has('高饱和') || tagSet.has('撞色')) return '色彩暴徒'
  if (tagSet.has('奇幻') || tagSet.has('超现实')) return '超现实造境师'
  if (tagSet.has('科幻') || tagSet.has('赛博朋克')) return '未来主义先知'
  if (tagSet.has('叙事') || tagSet.has('情绪')) return '胶片守旧派'
  if (tagSet.has('安静') || tagSet.has('治愈')) return '留白主义者'
  if (tagSet.has('特写') || tagSet.has('细节')) return '留白主义者'
  if (tagSet.has('广角') || tagSet.has('壮观')) return '山野拾光人'
  if (tagSet.has('对称') || tagSet.has('建筑感')) return '光影诗人'
  
  return '美学探索者'
}

export function AestheticQuiz() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<{ name: string; tagline: string; description: string } | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleAnswer = (tags: string[]) => {
    const newAnswers = [...answers, ...tags]
    setAnswers(newAnswers)
    setStep(step + 1)
    
    if (step + 1 >= QUIZ_QUESTIONS.length) {
      // 完成所有题目，生成结果
      const personality = determinePersonality(newAnswers)
      const info = PERSONALITY_MAP[personality] || PERSONALITY_MAP['美学探索者']
      setResult(info)
      setShowResult(true)
      
      // 保存到 localStorage 用于后续完善
      localStorage.setItem('cgfan_quiz_personality', JSON.stringify({
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
          3 道题，30 秒，找到你的审美基因
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