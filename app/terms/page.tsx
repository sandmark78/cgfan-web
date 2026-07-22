import Link from 'next/link'

export const runtime = 'edge'

/**
 * 条款页面
 */
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white mb-8">
        服务条款
      </h1>

      <div className="glass-card p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            1. 服务说明
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            CGfan 是一个 AI 提示词分享平台，展示来自 X (Twitter) 的 AI 生成艺术作品和提示词。
            我们仅提供信息展示服务，不参与任何 AI 生成过程。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            2. 版权声明
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              • 所有展示的提示词和作品版权均归原创作者所有
            </p>
            <p>
              • CGfan 仅作为信息聚合和展示平台，不拥有任何作品的版权
            </p>
            <p>
              • 如需使用任何作品，请联系原作者获取授权
            </p>
            <p>
              • 我们尊重知识产权，如发现侵权内容，请立即联系我们删除
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            3. 使用规范
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              • 用户可以使用平台展示的提示词进行个人创作
            </p>
            <p>
              • 商业使用需获得原作者授权
            </p>
            <p>
              • 禁止将平台内容用于违法、违规用途
            </p>
            <p>
              • 禁止恶意抓取、爬取平台数据
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            4. 隐私政策
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              • 我们收集必要的使用数据以改进服务
            </p>
            <p>
              • 不会向第三方出售或分享用户个人信息
            </p>
            <p>
              • 使用 Cookie 和类似技术优化用户体验
            </p>
            <p>
              • 用户有权要求删除其个人数据
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            5. 免责声明
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              • 平台不保证提示词的效果和结果
            </p>
            <p>
              • 使用提示词产生的任何后果由用户自行承担
            </p>
            <p>
              • 平台可能因技术原因暂时中断服务
            </p>
            <p>
              • 我们保留修改条款的权利，修改后将在平台公布
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            6. 侵权处理
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            如果您是版权所有者，发现平台展示的内容侵犯了您的权利，请提供以下信息联系我们：
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside ml-4">
            <li>您的身份证明（个人/公司）</li>
            <li>侵权内容的具体链接</li>
            <li>您的版权证明</li>
            <li>您的联系方式</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
            我们将在收到投诉后 3 个工作日内处理。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            7. 联系方式
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            如有任何问题，请通过以下方式联系我们：
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              📧 邮箱: <Link href="mailto:contact@cgfan.com" className="text-green-600 hover:text-green-700 dark:text-green-400">contact@cgfan.com</Link>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              🐦 X: <Link href="https://x.com/cgfan_ai" className="text-green-600 hover:text-green-700 dark:text-green-400">@cgfan_ai</Link>
            </p>
          </div>
        </section>

        <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            最后更新时间: 2026 年 2 月 3 日
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
