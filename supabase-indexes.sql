-- Supabase 索引优化
-- 执行时间：2026-01-XX
-- 目的：减少 Disk IO，优化查询性能

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

-- 3. 检查索引效果
-- 执行以下查询查看索引使用情况：
-- SELECT schemaname, tablename, indexname, idx_scan 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
