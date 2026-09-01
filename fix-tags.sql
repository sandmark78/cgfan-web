-- 标签清理和合并
-- 1. 删除泛标签（等于没标签）
-- 2. 合并中英文标签
-- 3. 合并重叠标签

-- 删除泛标签
UPDATE prompts
SET tags = array_remove(tags, 'AI绘图')
WHERE 'AI绘图' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, '提示词')
WHERE '提示词' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, 'AI')
WHERE 'AI' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, 'AI艺术')
WHERE 'AI艺术' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, 'AI生成')
WHERE 'AI生成' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, '')
WHERE '' = ANY(tags);

-- 合并中英文标签：portrait → 人像
UPDATE prompts
SET tags = array_replace(tags, 'portrait', '人像')
WHERE 'portrait' = ANY(tags) AND NOT '人像' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, 'portrait')
WHERE 'portrait' = ANY(tags) AND '人像' = ANY(tags);

-- editorial → 编辑设计
UPDATE prompts
SET tags = array_replace(tags, 'editorial', '编辑设计')
WHERE 'editorial' = ANY(tags) AND NOT '编辑设计' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, 'editorial')
WHERE 'editorial' = ANY(tags) AND '编辑设计' = ANY(tags);

-- landscape → 风景
UPDATE prompts
SET tags = array_replace(tags, 'landscape', '风景')
WHERE 'landscape' = ANY(tags) AND NOT '风景' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, 'landscape')
WHERE 'landscape' = ANY(tags) AND '风景' = ANY(tags);

-- 合并重叠标签：3D → 3D渲染
UPDATE prompts
SET tags = array_replace(tags, '3D', '3D渲染')
WHERE '3D' = ANY(tags) AND NOT '3D渲染' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, '3D')
WHERE '3D' = ANY(tags) AND '3D渲染' = ANY(tags);

-- 海报设计 → 海报
UPDATE prompts
SET tags = array_replace(tags, '海报设计', '海报')
WHERE '海报设计' = ANY(tags) AND NOT '海报' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, '海报设计')
WHERE '海报设计' = ANY(tags) AND '海报' = ANY(tags);

-- 视觉设计 → 编辑设计
UPDATE prompts
SET tags = array_replace(tags, '视觉设计', '编辑设计')
WHERE '视觉设计' = ANY(tags) AND NOT '编辑设计' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, '视觉设计')
WHERE '视觉设计' = ANY(tags) AND '编辑设计' = ANY(tags);

-- 字体排版 → 排版
UPDATE prompts
SET tags = array_replace(tags, '字体排版', '排版')
WHERE '字体排版' = ANY(tags) AND NOT '排版' = ANY(tags);

UPDATE prompts
SET tags = array_remove(tags, '字体排版')
WHERE '字体排版' = ANY(tags) AND '排版' = ANY(tags);

-- 验证结果
SELECT 
  unnest(tags) as tag,
  COUNT(*) as count
FROM prompts
GROUP BY tag
ORDER BY count DESC
LIMIT 50;
