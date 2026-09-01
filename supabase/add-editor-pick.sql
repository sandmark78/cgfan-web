-- 添加 editor_pick 字段到 prompts 表
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS editor_pick BOOLEAN DEFAULT FALSE;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_prompts_editor_pick ON prompts(editor_pick);

-- 标记一些高质量的提示词为编辑推荐
-- 基于评分 >= 70 且符合品味画像的内容
UPDATE prompts 
SET editor_pick = TRUE 
WHERE score >= 70 
  AND (
    tags @> ARRAY['编辑设计'] 
    OR tags @> ARRAY['东方美学']
    OR tags @> ARRAY['微缩']
    OR tags @> ARRAY['复古']
    OR title ILIKE '%未来洗衣店%'
    OR title ILIKE '%念奴娇%'
    OR title ILIKE '%窗边山水%'
    OR title ILIKE '%花卉巨象%'
    OR title ILIKE '%海边冬夜%'
  );

-- 查看标记结果
SELECT COUNT(*) as editor_pick_count FROM prompts WHERE editor_pick = TRUE;
