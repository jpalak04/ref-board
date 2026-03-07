-- ============================================================
-- RefBoard v2 Migration — Run in Supabase SQL Editor
-- ============================================================

-- 1. Extend refs table
ALTER TABLE refs ADD COLUMN IF NOT EXISTS board_id TEXT;
ALTER TABLE refs ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE refs ADD COLUMN IF NOT EXISTS action_tag TEXT DEFAULT 'inspiration';

-- 2. Boards table
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  color TEXT DEFAULT 'lime',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Board members table
CREATE TABLE IF NOT EXISTS board_members (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',   -- 'founder' or 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, member_name)
);

-- 4. RLS (open policies — team app, no auth required)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boards_open" ON boards;
DROP POLICY IF EXISTS "board_members_open" ON board_members;

CREATE POLICY "boards_open" ON boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "board_members_open" ON board_members FOR ALL USING (true) WITH CHECK (true);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_members;

-- 6. Seed: Founders Only board + Palak as Founder (PIN: 1234)
INSERT INTO boards (id, name, pin, color)
VALUES ('founders-board', 'Founders Only', '1234', 'lime')
ON CONFLICT (id) DO NOTHING;

INSERT INTO board_members (id, board_id, member_name, role)
VALUES ('member-palak', 'founders-board', 'Palak', 'founder')
ON CONFLICT (id) DO NOTHING;
