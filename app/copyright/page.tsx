export const metadata = {
  title: '版权与免责说明 | CGfan',
  description: 'CGfan 版权声明、内容归属、使用须知与删除机制说明。',
}

export default function CopyrightPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        版权与免责说明
      </h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          最后更新：2026 年 7 月 24 日
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            一、内容来源
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            本站（CGfan）收录的提示词与示例图，均来自互联网公开内容，
            主要为 X（Twitter）平台上创作者公开发布的 AI 创作分享。
            我们已尽可能标注原作者与出处，并附上原文链接。
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
            如有遗漏或标注错误，请与我们联系更正。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            二、版权归属
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>提示词与示例图的版权归原作者及/或原始发布平台所有。</li>
            <li>
              本站仅做收集、整理、分类与学习交流之用，不对该内容主张任何所有权。
            </li>
            <li>
              AI 生成内容的版权归属，目前在各国法律实践中仍存在差异与争议，
              本站对此不做任何权利主张或法律判断。
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            三、使用须知
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>提示词仅供参考。实际生成效果因模型、版本、参数而异。</li>
            <li>
              使用提示词时，请遵守你所使用的 AI 平台的服务条款。
            </li>
            <li>
              如需将相关内容用于商业用途，请自行确认权利状况，
              必要时取得原作者授权。本站不对使用结果承担责任。
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            四、删除机制（侵权通知）
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            我们尊重每一位创作者。
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            如果您是某条内容的原作者，且不希望它出现在本站，<strong>无需任何理由，联系我们即可</strong>。
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              📮 <strong>联系方式：</strong>
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              邮箱：<a href="mailto:copyright@cgfan.com" className="text-green-600 dark:text-green-400 hover:underline">copyright@cgfan.com</a>
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              请注明：内容链接 + 您的身份说明（如 X 账号）
            </p>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            我们承诺在 <strong>48 小时内</strong>核实并删除相关内容，
            同时删除对应的示例图与衍生信息。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            五、免责声明
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              本站内容为社区公开分享的整理，不保证其准确性、完整性或时效性。
            </li>
            <li>本站不构成任何法律、商业或专业建议。</li>
            <li>外部链接指向第三方平台，其内容与政策与本站无关。</li>
          </ul>
        </section>

        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-center italic">
            感谢每一位分享灵感的创作者。<br />
            是你们的公开分享，让这个画廊得以存在。
          </p>
        </section>
      </div>
    </div>
  )
}
