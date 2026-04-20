-- ╔═══════════════════════════════════════════════════════════╗
-- ║   POSTAI — RLS POLICIES + UNIQUE INDEX ONLY             ║
-- ║   Tables already exist, just adding security policies   ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════
--   1. PROFILES — Enable RLS + Policies
-- ═══════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════
--   2. BRANDS — Enable RLS + Policies + Unique Index
-- ═══════════════════════════════════════════════════════════
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own brand" ON brands;
DROP POLICY IF EXISTS "Users can insert own brand" ON brands;
DROP POLICY IF EXISTS "Users can update own brand" ON brands;

CREATE POLICY "Users can view own brand" ON brands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand" ON brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand" ON brands
  FOR UPDATE USING (auth.uid() = user_id);

-- Unique index needed for upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS brands_user_id_unique ON brands(user_id);

-- ═══════════════════════════════════════════════════════════
--   3. POSTS — Enable RLS + Policies
-- ═══════════════════════════════════════════════════════════
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can view own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
