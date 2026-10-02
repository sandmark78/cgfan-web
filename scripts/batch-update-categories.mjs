import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { glob } from 'glob'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const mdFiles = glob.sync('content/prompts/**/*.md')
console.log(`📖 读取 ${mdFiles.length} 个文件...`)

const updates = []

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf-8')
  const slugMatch = content.match(/^slug:\s*(.+)$/m)
  const categoryMatch = content.match(/^category:\s*(.+)$/m)
  const modelMatch = content.match(/^model:\s*(.+)$/m)
  
  if (!slugMatch) continue
  
  const slug = slugMatch[1].trim()
  const category = categoryMatch ? categoryMatch[1].trim().replace(/^["']|["']$/g, '') : null
  const model = modelMatch ? modelMatch[1].trim().replace(/^["']|["']$/g, '') : null
  
  if (category || model) {
    updates.push({ slug, category, model })
  }
}

console.log(`📦 准备更新 ${updates.length} 条记录...`)

let success = 0
let failed = 0

// 逐条更新（只更新category和model字段）
for (const item of updates) {
  const { error } = await supabase
    .from('prompts')
    .update({ category: item.category, model: item.model })
    .eq('slug', item.slug)
  
  if (error) {
    console.error(`❌ ${item.slug} 失败:`, error.message)
    failed++
  } else {
    success++
    if (success % 200 === 0) {
      console.log(`✅ 已更新 ${success}/${updates.length}`)
    }
  }
}

console.log(`\n📊 完成: 成功 ${success}, 失败 ${failed}`)
