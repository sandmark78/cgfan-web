-- Supabase 索引优化 - 在 Dashboard SQL Editor 中执行
-- 执行步骤：
-- 1. 打开 https://supabase.com/dashboard/
-- 2. 选择项目：kxgmtmcspzetyxkhemsw
-- 3. 进入 SQL Editor
-- 4. 复制此文件内容并执行

-- 1. prompts 表索引
CREATE INDEX IF NOT EXISTS idx_prompts_added ON prompts(added DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
CREATE INDEX IF NOT EXISTS idx_prompts_difficulty ON prompts(difficulty);

-- 2. likes 表索引
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_prompt_slug ON likes(prompt_slug);
CREATE INDEX IF NOT EXISTS idx_likes_composite ON likes(user_id, prompt_slug);

-- 3. 验证索引已创建
SELECT 
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
