-- 添加评分字段到 prompts 表
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 总分
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS score INTEGER;

-- 8维度评分
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS composition INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS color INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS lighting INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS detail INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS creativity INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS technical INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS aesthetic INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS curation INTEGER;

-- 添加索引（可选，提升查询性能）
CREATE INDEX IF NOT EXISTS idx_prompts_score ON prompts(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_prompts_composition ON prompts(composition DESC NULLS LAST);
