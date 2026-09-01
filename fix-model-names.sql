-- 修复 prompts 表模型名称不统一问题
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行

-- 1. 统一 GPT-Image 系列名称
-- GPT-image2 → GPT-Image 2
UPDATE prompts SET model = 'GPT-Image 2' WHERE model = 'GPT-image2';

-- GPT-Image2 → GPT-Image 2
UPDATE prompts SET model = 'GPT-Image 2' WHERE model = 'GPT-Image2';

-- 2. 统一"通用"名称
-- 通用 → 通用 Prompt
UPDATE prompts SET model = '通用 Prompt' WHERE model = '通用';

-- 3. 统一 unknown
UPDATE prompts SET model = 'Unknown' WHERE model = 'unknown';

-- 4. 统一 AI → Unknown（太模糊，不如 Unknown）
UPDATE prompts SET model = 'Unknown' WHERE model = 'AI';

-- 验证修复结果
SELECT model, COUNT(*) as count
FROM prompts
GROUP BY model
ORDER BY count DESC;
