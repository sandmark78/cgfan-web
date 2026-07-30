import Link from 'next/link'
import type { Metadata } from 'next'

export const runtime = 'edge'

/**
 * About 页 SEO 元数据
 */
export const metadata: Metadata = {
  title: '关于 | CGfan - AI 提示词策展画廊',
  description: 'CGfan 是一个有编辑灵魂的 AI 提示词策展站。每日一味精选，附策展笔记；收藏解锁美学人格；分享卡片下载分享；分类浏览、一键复制。涵盖 Midjourney、Gemini、GPT Image 等主流模型。',
  openGraph: {
    title: '关于 | CGfan - AI 提示词策展画廊',
    description: '每日一味精选 · 美学人格 · 分享卡片。有编辑灵魂的 AI 提示词策展站。',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '关于 | CGfan - AI 提示词策展画廊',
    description: '每日一味精选 · 美学人格 · 分享卡片。有编辑灵魂的 AI 提示词策展站。',
  },
}

/**
 * 关于页面
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white mb-8">
        关于 CGfan
      </h1>

      <div className="glass-card p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            🎨 什么是 CGfan？
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            CGfan 是一个有编辑灵魂的 AI 提示词策展站。不是数据库式的 prompt 堆砌，而是有策展人筛选、点评、推荐的精选画廊。
            我们从 X (Twitter) 上挖掘优质的 AI 生图提示词，附上示例图和策展笔记，帮你发现真正值得复制的好 prompt。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            ✨ 核心特色
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>每日一味</strong> — 每天精选一个 prompt，附策展笔记和亮点解读。不贪多，只选好的。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>美学人格</strong> — 收藏 20 个提示词，AI 分析你的审美偏好，从 36 种人格（12 基础 + 24 深度进化）中匹配最像你的一个，生成专属风格卡片，支持下载分享。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>Prompt DNA 分析</strong> — 每条提示词自动分析风格特征、光线特征、构图特征、材质特征，智能推荐适用模型。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>Prompt 卡片分享</strong> — 每个 prompt 详情页可生成精美分享卡片，一键下载为 PNG，包含 prompt 预览、模型参数和标签，方便分享到社交媒体。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>策展人视角</strong> — 不是算法推荐，是人工筛选。每条 prompt 都有审美评分和技术评估。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>分类 + 标签双维度</strong> — 按风格分类（写实、3D、海报、商业等），按标签筛选（摄影、极简、复古等），快速定位你需要的。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>完整提示词 + 参数</strong> — 每条作品附带完整 Prompt、Negative Prompt、模型信息和参数设置，复制即用。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>点赞 + 收藏</strong> — 为你喜欢的 prompt 点赞，收藏到你的品味库，解锁更多个性化功能。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>多模型支持</strong> — 涵盖 Midjourney、Gemini、GPT Image 2、Grok、Seedream 等主流模型。
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>无限滚动 + 分页</strong> — 探索页支持无限滚动浏览，也支持传统分页，按需切换。
              </div>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            🚀 如何使用
          </h2>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300 list-decimal list-inside">
            <li>首页看「每日一味」— 每天一个精选推荐，查看往期精选</li>
            <li>探索页按分类/标签筛选，或搜索关键词</li>
            <li>点击卡片进入详情页，查看完整提示词、示例图和 Prompt DNA 分析</li>
            <li>点击「复制提示词」按钮，粘贴到你的 AI 工具</li>
            <li>点击 ❤️ 点赞，点击 📦 收藏，建立你的品味库</li>
            <li>收藏满 20 个，访问「美学人格」解锁你的专属审美风格卡片（36 种人格）</li>
            <li>在详情页「生成分享卡片」下载 Prompt 卡片，分享到社交媒体</li>
            <li>订阅我们的邮件或 RSS，每天自动接收精选推荐</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            📮 联系我们
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            如果你有优秀的提示词想要分享，或者发现任何问题，欢迎通过以下方式联系我们：
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              🐦 X (Twitter): <Link href="https://x.com/cgfan_ai" className="text-green-600 hover:text-green-700 dark:text-green-400">@cgfan_ai</Link>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              📧 邮箱: contact@cgfan.com
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            📜 版权声明
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            所有提示词和示例图均来自 X (Twitter) 公开内容，版权归原创作者所有。
            CGfan 仅作为策展展示平台，不拥有任何作品的版权。如需商用，请联系原作者获取授权。
          </p>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="btn-primary inline-block">
          返回首页
        </Link>
      </div>
    </div>
  )
}
