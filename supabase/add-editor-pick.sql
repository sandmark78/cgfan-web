-- 添加 editor_pick 字段
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS editor_pick BOOLEAN DEFAULT FALSE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prompts_editor_pick ON prompts(editor_pick);

-- 标记高质量内容为编辑推荐（基于标签和难度）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE difficulty = 'advanced'
  AND (
    tags @> ARRAY['编辑设计'] 
    OR tags @> ARRAY['东方美学']
    OR tags @> ARRAY['微缩']
    OR tags @> ARRAY['复古']
    OR tags @> ARRAY['电影感']
    OR tags @> ARRAY['留白']
  );

-- 也可以手动标记特定内容
-- UPDATE prompts SET editor_pick = TRUE WHERE slug IN ('prompt-xxx', 'prompt-yyy');

-- 查看标记结果
SELECT COUNT(*) as editor_pick_count FROM prompts WHERE editor_pick = TRUE;
