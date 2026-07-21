-- Supabase 数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 用户资料表（扩展信息）
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_slug)
);

-- 点赞表
CREATE TABLE likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_slug)
);

-- 索引
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_prompt ON likes(prompt_slug);

-- 启用 RLS（行级安全）
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能操作自己的数据
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own likes" ON likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 用户资料：所有人可见，只能编辑自己的
CREATE POLICY "User profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 公开点赞数（用于统计展示）
CREATE POLICY "Anyone can view likes count" ON likes
  FOR SELECT USING (true);

-- 函数：获取提示词的点赞数
CREATE OR REPLACE FUNCTION get_prompt_like_count(slug TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM likes WHERE prompt_slug = slug;
$$ LANGUAGE SQL STABLE;

-- 函数：获取提示词的收藏数
CREATE OR REPLACE FUNCTION get_prompt_favorite_count(slug TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM favorites WHERE prompt_slug = slug;
$$ LANGUAGE SQL STABLE;
