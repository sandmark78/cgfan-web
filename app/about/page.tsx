import Link from 'next/link'

export const runtime = 'edge'

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
            CGfan 是一个 AI 提示词画廊，汇集了从 X (Twitter) 上精选的 AI 生成艺术作品和提示词。
            我们致力于帮助创作者发现优秀的提示词，学习 AI 绘画技巧，激发创作灵感。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            ✨ 核心功能
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>分类浏览</strong> — 按风格分类（写实、3D、动漫、赛博朋克等），快速找到你喜欢的类型
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>完整提示词</strong> — 每条作品附带完整的 Prompt、参数设置和作者信息
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>一键复制</strong> — 点击复制按钮，快速复制提示词到你的 AI 工具
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 text-xl">•</span>
              <div>
                <strong>多模型支持</strong> — 涵盖 Midjourney、Gemini、Grok、Stable Diffusion 等主流模型
              </div>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            🚀 如何使用
          </h2>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300 list-decimal list-inside">
            <li>浏览首页或探索页，找到喜欢的作品</li>
            <li>点击卡片进入详情页，查看完整提示词</li>
            <li>点击"复制提示词"按钮</li>
            <li>粘贴到你的 AI 工具（Midjourney、Gemini 等）</li>
            <li>根据需要调整参数，生成你自己的作品</li>
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
            所有提示词和作品均来自 X (Twitter) 公开内容，版权归原创作者所有。
            我们仅作为展示和分享平台，不拥有任何作品的版权。
            如需商用，请联系原作者获取授权。
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
