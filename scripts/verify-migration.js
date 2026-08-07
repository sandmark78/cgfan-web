import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  // 验证总数
  const { count, error } = await supabase.from('prompts').select('*', { count: 'exact', head: true });
  console.log('总条数:', count);
  
  if (error) {
    console.error('查询错误:', error);
    return;
  }

  // 抽样检查
  const { data: sample } = await supabase.from('prompts').select('title, slug, category').limit(3);
  console.log('\n抽样数据:');
  sample.forEach(p => console.log(`- ${p.title} (${p.slug})`));

  // 检查分类分布
  const { data: categories } = await supabase
    .from('prompts')
    .select('category')
    .not('category', 'is', null);
  
  const categoryCount = {};
  categories.forEach(c => {
    categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
  });
  
  console.log('\n分类分布:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`- ${cat}: ${count}`));
}

verify().catch(console.error);
