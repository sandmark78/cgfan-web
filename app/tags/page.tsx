import { getAllTags } from '@/lib/prompts'
import Link from 'next/link'
import { getCategoryLabel, getCategoryIcon } from '@/lib/category-map'

export const runtime = 'edge'

export const metadata = {
  title: '标签 | CGfan',
  description: '浏览所有 AI 提示词标签，按主题分类查找你感兴趣的 prompt。',
}

// 标签描述映射
const TAG_DESCRIPTIONS: Record<string, string> = {
  'portrait': '人像摄影提示词，包括人物肖像、表情、姿态等',
  'landscape': '风景摄影提示词，包括自然风光、城市景观等',
  'style': '风格化提示词，包括艺术风格、视觉效果等',
  '3d': '3D 渲染提示词，包括建模、材质、光照等',
  'commercial': '商业摄影提示词，包括产品、广告、品牌等',
  'anime': '动漫风格提示词，包括角色设计、场景等',
  'cyberpunk': '赛博朋克风格提示词，包括未来科技、霓虹灯等',
  'realistic': '写实风格提示词，包括真实感、细节等',
  'fantasy': '奇幻风格提示词，包括魔法、神话等',
  'product': '产品摄影提示词，包括商品展示、包装等',
  'design': '设计类提示词，包括排版、构图等',
  'photography': '摄影技巧提示词，包括相机参数、光线等',
  'AI绘图': 'AI 绘画相关提示词',
  '提示词工程': '提示词工程技巧和方法',
  'AI绘画': 'AI 绘画创作提示词',
  '提示词': '通用提示词模板',
  'poster': '海报设计提示词',
  'AI Art': 'AI 艺术创作提示词',
  '教程': '教程类提示词',
  '3D渲染': '3D 渲染相关提示词',
  '写实': '写实风格提示词',
  '国风': '中国风格提示词',
  'AI图像生成': 'AI 图像生成提示词',
  'NanoBananaPro': 'Nano Banana Pro 模型提示词',
  'Nanobanana': 'Nanobanana 模型提示词',
  'AI生图': 'AI 生图提示词',
  'AIArt': 'AI 艺术提示词',
  '艺术': '艺术创作提示词',
  '视频': '视频生成提示词',
  'GPT-Image2': 'GPT Image 2 模型提示词',
}

export default function TagsPage() {
  const tags = getAllTags()
  
  // 按数量排序
  const sortedTags = [...tags].sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          标签
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          共 {tags.length} 个标签，按主题分类查找你感兴趣的 prompt
        </p>

        <div className="space-y-3">
          {sortedTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/explore?tag=${encodeURIComponent(tag.name)}`}
              className="block p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-md group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
                  #{tag.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tag.count} 个提示词
                </span>
              </div>
              {TAG_DESCRIPTIONS[tag.name] && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {TAG_DESCRIPTIONS[tag.name]}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
