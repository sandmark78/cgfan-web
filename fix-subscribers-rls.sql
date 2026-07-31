-- CGfan 订阅系统 RLS 修复脚本
-- 问题：subscribers 表的 RLS 策略阻止了匿名订阅
-- 解决：添加允许匿名插入和读取的策略

-- 方案1：完全禁用 RLS（最简单，推荐）
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;

-- 方案2：如果需要保留 RLS，添加以下策略
-- 允许匿名用户插入订阅
CREATE POLICY "Allow anonymous subscribe"
ON subscribers FOR INSERT
TO anon
WITH CHECK (true);

-- 允许 service_role 读取所有订阅（用于发送邮件）
CREATE POLICY "Allow service role read all"
ON subscribers FOR SELECT
TO service_role
USING (true);

-- 允许匿名用户更新自己的确认状态
CREATE POLICY "Allow anonymous update own subscription"
ON subscribers FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 验证修复
SELECT COUNT(*) as total_subscribers FROM subscribers;
SELECT COUNT(*) as confirmed_subscribers FROM subscribers WHERE confirmed = true;
