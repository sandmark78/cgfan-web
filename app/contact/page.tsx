import Link from 'next/link'

export const runtime = 'edge'

/**
 * 联系页面
 */
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white mb-8">
        联系我们
      </h1>

      <div className="glass-card p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            📮 联系方式
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🐦</span>
              <div>
                <strong>X (Twitter)</strong>
                <p className="mt-1">
                  <Link href="https://x.com/cgfan_ai" className="text-green-600 hover:text-green-700 dark:text-green-400">
                    @cgfan_ai
                  </Link>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  关注我们的官方账号，获取最新提示词分享
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <strong>邮箱</strong>
                <p className="mt-1">contact@cgfan.com</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  商务合作、问题反馈、建议意见
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <strong>社区</strong>
                <p className="mt-1">
                  <Link href="https://x.com/cgfan_ai" className="text-green-600 hover:text-green-700 dark:text-green-400">
                    加入我们的 X 社区
                  </Link>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  与其他创作者交流，分享你的作品
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            💡 提交提示词
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            如果你有优秀的 AI 生成作品和提示词想要分享，欢迎提交给我们！
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">提交要求：</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>完整的提示词（Prompt）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>生成的示例图片</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>使用的 AI 模型（Midjourney、Gemini 等）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>参数设置（如 --ar, --v 等）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>原作者信息（如非本人创作）</span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            ❓ 常见问题
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Q: 如何使用这些提示词？
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                A: 点击作品详情页的"复制提示词"按钮，然后粘贴到你的 AI 工具（如 Midjourney、Gemini、Stable Diffusion 等）中即可。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Q: 可以商用这些作品吗？
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                A: 所有作品版权归原创作者所有。如需商用，请联系原作者获取授权。我们仅作为展示和分享平台。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Q: 如何提交我的作品？
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                A: 通过邮箱 contact@cgfan.com 或 X 私信联系我们，附上作品信息和提示词。
              </p>
            </div>
          </div>
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
