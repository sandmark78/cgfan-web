'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QUIZ_QUESTIONS, type QuizOption } from '@/lib/quiz-questions'
import { processQuizAnswers, type BasePersona } from '@/lib/aesthetic-engine'

/**
 * 美学人格快速测试组件
 * 4道题，30秒，基于8维美学空间匹配12种基础人格
 * 已完成测试的用户不会显示此组件
 */
export function AestheticQuiz() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0=未开始, 1-4=答题中, 5=完成
  const [answers, setAnswers] = useState<QuizOption[]>([])
  const [result, setResult] = useState<BasePersona | null>(null)
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false)

  // 检查用户是否已完成测试
  useEffect(() => {
    const saved = localStorage.getItem('cgfan_quiz_result')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.persona) {
          setHasCompletedQuiz(true)
          setResult(data.persona)
        }
      } catch (e) {
        console.error('Failed to parse quiz result:', e)
      }
    }
  }, [])

  const handleAnswer = (option: QuizOption) => {
    const newAnswers = [...answers, option]
    setAnswers(newAnswers)

    if (step < 4) {
      setStep(step + 1)
    } else {
      // 最后一题，计算结果
      const persona = processQuizAnswers(newAnswers)
      setResult(persona)
      setStep(5)

      // 保存到 localStorage
      localStorage.setItem('cgfan_quiz_result', JSON.stringify({
        persona,
        answers: newAnswers,
        timestamp: Date.now()
      }))
    }
  }

  const handleRetake = () => {
    setStep(0)
    setAnswers([])
    setResult(null)
    setHasCompletedQuiz(false)
    localStorage.removeItem('cgfan_quiz_result')
  }

  const handleExplore = () => {
    router.push('/explore')
  }

  // 如果用户已完成测试，不显示组件
  if (hasCompletedQuiz) {
    return null
  }

  // 未开始
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
        <button
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-500 hover:shadow-lg"
        >
          开始测试
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  // 答题中 (step 1-4)
  if (step >= 1 && step <= 4) {
    const question = QUIZ_QUESTIONS[step - 1]

    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{step} / 4</span>
            <span>第 {step} 题</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* 问题 */}
        <h3 className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
          {question.question}
        </h3>
        <p className="mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
          {question.subtitle}
        </p>

        {/* 选项 - 3x2 网格 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {question.options.map((option) => (
            <button
              key={option.text}
              onClick={() => handleAnswer(option)}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/60 p-4 transition-all hover:border-green-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-green-500"
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

  // 完成 (step 5)
  if (step === 5 && result) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 text-center dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">
          你的初始美学人格
        </div>
        <h3 className="font-serif text-3xl font-black text-gray-900 dark:text-white">
          {result.name}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {result.en}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 italic">
          「{result.tagline}」
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
          <button
            onClick={handleExplore}
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-500 hover:shadow-lg"
          >
            去收藏提示词完善
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleRetake}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
          >
            重新测试
          </button>
        </div>
      </div>
    )
  }

  return null
}
