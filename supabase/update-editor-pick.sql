-- 清空现有编辑推荐标记
UPDATE prompts SET editor_pick = FALSE;

-- 基于品味画像重新标记编辑推荐
-- 使用实际存在的标签，避免匹配不到

-- 1. 微缩+工艺感+叙事性（微缩+纸艺/手工质感）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['微缩'] 
  AND (tags @> ARRAY['纸艺'] OR tags @> ARRAY['手工质感']);

-- 2. 东方古风+低调电影感（东方美学+电影感）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['东方美学'] 
  AND tags @> ARRAY['电影感'];

-- 3. 复古未来主义+太空西部（复古+赛博朋克/科幻）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['复古'] 
  AND (tags @> ARRAY['赛博朋克'] OR tags @> ARRAY['科幻']);

-- 4. 工笔线描+东方神明+矿物重彩（国风+仙侠/古风）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['国风'] 
  AND (tags @> ARRAY['仙侠'] OR tags @> ARRAY['古风']);

-- 5. 电影感+孤独情绪+35mm胶片（电影感+留白/极简）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['电影感'] 
  AND (tags @> ARRAY['留白'] OR tags @> ARRAY['极简']);

-- 6. 东方美学+留白（极致留白，东方极简）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['东方美学'] 
  AND tags @> ARRAY['留白'];

-- 7. 微缩+叙事性（微缩+编辑设计）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['微缩'] 
  AND tags @> ARRAY['编辑设计'];

-- 8. 复古+印刷质感（复古+排版/海报）
UPDATE prompts 
SET editor_pick = TRUE 
WHERE tags @> ARRAY['复古'] 
  AND (tags @> ARRAY['排版'] OR tags @> ARRAY['海报']);

-- 查看标记结果
SELECT COUNT(*) as editor_pick_count FROM prompts WHERE editor_pick = TRUE;

-- 查看具体标记的内容（前20条）
SELECT title, tags FROM prompts WHERE editor_pick = TRUE LIMIT 20;
