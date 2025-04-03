import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const dbFile = path.resolve(process.cwd(), 'database.sqlite');

// 创建 SQLite 数据库连接
const openDb = async (): Promise<Database> => {
  return open({
    filename: dbFile,
    driver: sqlite3.Database
  });
};

interface Migration {
  name: string;
}

interface RunResult {
  lastID: number;
  changes: number;
}

// 包装数据库操作
class DB {
  private db: Database | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.db = await openDb();
      console.log('数据库连接成功');
      
      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON');
      
      // 应用迁移
      await this.applyMigrations();
    } catch (error) {
      console.error('数据库连接错误:', error);
    }
  }

  // 应用数据库迁移
  private async applyMigrations() {
    try {
      const migrationsDir = path.join(process.cwd(), 'src/db/migrations');
      
      // 确保migrations表存在
      await this.db?.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 读取已应用的迁移
      const appliedMigrations = await this.db?.all<Migration[]>('SELECT name FROM migrations');
      const appliedMigrationNames = new Set(appliedMigrations?.map((m: Migration) => m.name) || []);

      // 读取迁移文件
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
          .filter(file => file.endsWith('.sql'))
          .sort(); // 确保按字母顺序应用

        for (const file of files) {
          if (!appliedMigrationNames.has(file)) {
            console.log(`应用迁移: ${file}`);
            const migrationPath = path.join(migrationsDir, file);
            const migration = fs.readFileSync(migrationPath, 'utf8');
            
            // 在事务中应用迁移
            await this.db?.exec('BEGIN TRANSACTION');
            await this.db?.exec(migration);
            await this.db?.run('INSERT INTO migrations (name) VALUES (?)', [file]);
            await this.db?.exec('COMMIT');
          }
        }
      } else {
        console.log('迁移目录不存在', migrationsDir);
      }
    } catch (error) {
      console.error('应用迁移错误:', error);
      await this.db?.exec('ROLLBACK');
    }
  }

  // 执行查询并返回所有结果
  async all<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (!this.db) await this.init();
    return this.db!.all(sql, params) as Promise<T>;
  }

  // 执行查询并返回第一个结果
  async get<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (!this.db) await this.init();
    return this.db!.get(sql, params) as Promise<T>;
  }

  // 执行更新/插入/删除操作
  async run(sql: string, params: any[] = []): Promise<RunResult> {
    if (!this.db) await this.init();
    return this.db!.run(sql, params) as Promise<RunResult>;
  }

  // 执行任意SQL语句
  async exec(sql: string): Promise<void> {
    if (!this.db) await this.init();
    return this.db!.exec(sql);
  }
}

// 创建数据库实例
export const db = new DB(); 