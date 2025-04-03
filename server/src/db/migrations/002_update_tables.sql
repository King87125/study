-- 创建管理员账号（如果不存在）
INSERT OR IGNORE INTO Users (username, email, password, is_admin, createdAt, updatedAt)
VALUES ('管理员', '040522@hlp.jzh', '$2a$10$8Ux.YxMjiCqM1PYwMvvPXehMfVcXeRKEfUjQj3Fd2kP9PUMrIULwe', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 更新videoUrl到url
UPDATE Videos SET url = videoUrl WHERE url IS NULL;
