-- 添加is_admin列到users表
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- 更新v.url引用，确保videos表包含正确的列名
-- 检查videos表
PRAGMA table_info(videos);

-- 如果videos表中不存在url列但存在file_url列，添加url列并将file_url数据复制过来
ALTER TABLE videos ADD COLUMN url TEXT;
UPDATE videos SET url = file_url WHERE url IS NULL;

-- 新增study_plans表（如果不存在）
CREATE TABLE IF NOT EXISTS study_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  resource_id INTEGER NOT NULL,
  priority INTEGER DEFAULT 2,
  notes TEXT,
  completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建管理员账号（如果不存在）
INSERT OR IGNORE INTO users (username, email, password, is_admin, created_at, updated_at)
VALUES ('管理员', '040522@hlp.jzh', '$2a$10$8Ux.YxMjiCqM1PYwMvvPXehMfVcXeRKEfUjQj3Fd2kP9PUMrIULwe', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 