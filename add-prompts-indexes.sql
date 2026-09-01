-- 为 prompts 表添加索引，提升查询性能
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行

-- 1. slug 索引（详情页查询）
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);

-- 2. tags 索引（标签筛选，使用 GIN 索引支持数组查询）
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

-- 3. model 索引（模型筛选）
CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);

-- 4. added 索引（按时间排序）
CREATE INDEX IF NOT EXISTS idx_prompts_added ON prompts(added DESC);

-- 5. 复合索引：model + added（模型筛选 + 时间排序）
CREATE INDEX IF NOT EXISTS idx_prompts_model_added ON prompts(model, added DESC);

-- 6. 复合索引：tags + added（标签筛选 + 时间排序）
CREATE INDEX IF NOT EXISTS idx_prompts_tags_added ON prompts USING GIN(tags) INCLUDE (added);

-- 验证索引创建成功
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'prompts' 
ORDER BY indexname;
