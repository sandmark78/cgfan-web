-- 后台管理系统数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 提示词表（用于后台管理）
CREATE TABLE prompts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT DEFAULT '',
  model TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'intermediate',
  cover TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT '',
  author TEXT DEFAULT '',
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员表
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_prompts_slug ON prompts(slug);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_date ON prompts(date);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);

-- 启用 RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS 策略：提示词 - 所有人可读，只有管理员可写
CREATE POLICY "Prompts are viewable by everyone" ON prompts
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert prompts" ON prompts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update prompts" ON prompts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete prompts" ON prompts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- RLS 策略：管理员表 - 只有管理员可读
CREATE POLICY "Admins can view admins" ON admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认管理员（sandmark78@gmail.com）
-- 注意：需要先获取该用户的 UUID，然后手动插入
-- INSERT INTO admins (id, email) VALUES ('用户UUID', 'sandmark78@gmail.com');
