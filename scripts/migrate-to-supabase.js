import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env.local') });

// 读取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxgmtmcspzetyxkhemsw.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('错误: 需要设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTable() {
  console.log('创建 prompts 表...\n');

  const sql = `
    -- 创建 prompts 表
    CREATE TABLE IF NOT EXISTS prompts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      model TEXT,
      category TEXT,
      tags TEXT[] DEFAULT '{}',
      difficulty TEXT,
      cover TEXT,
      images TEXT[] DEFAULT '{}',
      date TEXT,
      added TEXT,
      source TEXT,
      source_link TEXT,
      author TEXT,
      author_link TEXT,
      prompt TEXT,
      negative_prompt TEXT,
      parameters JSONB DEFAULT '{}',
      mtime BIGINT,
      prompt_dna JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
    CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
    CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
    CREATE INDEX IF NOT EXISTS idx_prompts_added ON prompts(added DESC);
    CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

    -- 更新时间戳触发器
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
    CREATE TRIGGER update_prompts_updated_at
      BEFORE UPDATE ON prompts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  // Supabase JS 不直接支持执行任意 SQL，需要通过 REST API
  // 这里我们直接执行数据插入，表结构需要手动在 Supabase Dashboard 创建
  
  console.log('请在 Supabase Dashboard 中执行以下 SQL:');
  console.log('https://supabase.com/dashboard/project/kxgmtmcspzetyxkhemsw/sql/new\n');
  console.log(sql);
  console.log('\n执行完成后，按回车继续数据迁移...');
  
  await new Promise(resolve => process.stdin.once('data', resolve));
}

async function migrate() {
  console.log('\n开始迁移 prompts 数据到 Supabase...\n');

  // 读取 prompts-data.ts
  const dataPath = join(__dirname, '../lib/prompts-data.ts');
  const content = readFileSync(dataPath, 'utf-8');
  
  // 提取 Base64 数据
  const match = content.match(/export default `([^`]+)`/);
  if (!match) {
    console.error('错误: 无法从 prompts-data.ts 提取数据');
    process.exit(1);
  }
  
  const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
  const prompts = JSON.parse(decoded);
  
  console.log(`找到 ${prompts.length} 条提示词数据\n`);

  // 转换数据格式
  const transformedPrompts = prompts.map(p => ({
    title: p.title,
    slug: p.slug,
    model: p.model,
    category: p.category,
    tags: p.tags || [],
    difficulty: p.difficulty,
    cover: p.cover,
    images: p.images || [],
    date: p.date,
    added: p.added,
    source: p.source,
    source_link: p.sourceLink,
    author: p.author,
    author_link: p.authorLink,
    prompt: p.prompt,
    negative_prompt: p.negativePrompt,
    parameters: p.parameters || {},
    mtime: p.mtime ? Math.floor(p.mtime) : null,
    prompt_dna: p.promptDNA
  }));

  // 分批插入（每批 100 条）
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  const failedBatches = [];

  for (let i = 0; i < transformedPrompts.length; i += batchSize) {
    const batch = transformedPrompts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(transformedPrompts.length / batchSize);
    
    console.log(`正在插入第 ${batchNum}/${totalBatches} 批...`);

    const { data, error } = await supabase
      .from('prompts')
      .upsert(batch, { onConflict: 'slug' });

    if (error) {
      console.error(`批次 ${batchNum} 插入失败:`, error.message);
      errorCount += batch.length;
      failedBatches.push({ batchNum, batch });
    } else {
      successCount += batch.length;
      console.log(`✓ 批次 ${batchNum} 成功插入 ${batch.length} 条`);
    }
  }

  // 重试失败的批次
  if (failedBatches.length > 0) {
    console.log(`\n重试 ${failedBatches.length} 个失败的批次...`);
    for (const { batchNum, batch } of failedBatches) {
      console.log(`重试批次 ${batchNum}...`);
      const { data, error } = await supabase
        .from('prompts')
        .upsert(batch, { onConflict: 'slug' });

      if (error) {
        console.error(`批次 ${batchNum} 重试失败:`, error.message);
      } else {
        successCount += batch.length;
        errorCount -= batch.length;
        console.log(`✓ 批次 ${batchNum} 重试成功`);
      }
    }
  }

  console.log('\n迁移完成!');
  console.log(`成功: ${successCount} 条`);
  console.log(`失败: ${errorCount} 条`);
}

async function main() {
  // 跳过交互式等待，直接迁移数据
  console.log('假设表已创建，直接开始数据迁移...\n');
  await migrate();
}

main().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
