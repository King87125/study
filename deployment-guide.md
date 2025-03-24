# 考研伴侣网站阿里云部署指南

本文档提供了将"考研伴侣"网站部署到阿里云的详细步骤。

## 一、准备工作

1. **阿里云账号**
   - 注册并激活阿里云账号
   - 完成实名认证

2. **域名准备（可选）**
   - 通过阿里云购买域名
   - 完成域名备案（中国大陆服务器必须）

3. **项目代码准备**
   - 确保项目已上传到GitHub: https://github.com/King87125/study.git

## 二、服务器配置

### 1. 购买ECS（云服务器）

1. 登录阿里云控制台，进入ECS产品页
2. 购买ECS实例：
   - 地域：选择离目标用户较近的地域
   - 实例规格：推荐至少2核4GB内存
   - 操作系统：Ubuntu 20.04 LTS
   - 带宽：按需选择（至少1Mbps）
   - 存储：系统盘50GB
   - 安全组：开放80、443端口（HTTP/HTTPS）和22端口（SSH）

### 2. 连接服务器并安装必要软件

```bash
# 使用SSH连接到服务器
ssh root@<your-server-ip>

# 更新软件包
apt update
apt upgrade -y

# 安装Node.js和npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 验证安装
node -v
npm -v

# 安装PM2用于进程管理
npm install -g pm2

# 安装Nginx
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx

# 安装Git
apt install -y git

# 安装SQLite3
apt install -y sqlite3

# 安装开发工具
apt install -y build-essential
```

## 三、部署后端服务

### 1. 克隆项目代码

```bash
# 创建应用目录
mkdir -p /var/www/kaoyan-buddy
cd /var/www/kaoyan-buddy

# 克隆代码
git clone https://github.com/King87125/study.git .
```

### 2. 配置后端环境变量

```bash
# 进入服务器目录
cd /var/www/kaoyan-buddy/server

# 创建.env文件
cat > .env << EOL
PORT=5001
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_key
EOL
```

### 3. 安装依赖并构建后端

```bash
# 安装依赖
npm install

# 构建TypeScript项目
npm run build
```

### 4. 设置PM2启动服务

```bash
# 使用PM2启动后端服务
pm2 start dist/index.js --name kaoyan-backend

# 设置PM2开机自启
pm2 startup
pm2 save
```

## 四、部署前端服务

### 1. 修改前端API地址

编辑 `/var/www/kaoyan-buddy/client/src/utils/axios.ts` 文件：

```typescript
import axios from 'axios';

// 修改为服务器地址
axios.defaults.baseURL = 'https://你的域名或服务器IP';
// 如果没有域名，使用 http://服务器IP:5001
```

### 2. 构建前端项目

```bash
# 进入前端目录
cd /var/www/kaoyan-buddy/client

# 安装依赖
npm install

# 构建生产环境版本
npm run build
```

### 3. 配置Nginx托管前端

创建Nginx配置文件：

```bash
cat > /etc/nginx/sites-available/kaoyan-buddy << EOL
server {
    listen 80;
    server_name 你的域名或服务器IP;
    
    # 前端静态文件
    location / {
        root /var/www/kaoyan-buddy/client/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 上传文件的静态服务
    location /uploads {
        alias /var/www/kaoyan-buddy/server/uploads;
    }
}
EOL

# 启用配置
ln -s /etc/nginx/sites-available/kaoyan-buddy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # 移除默认配置

# 测试配置语法
nginx -t

# 重启Nginx
systemctl restart nginx
```

## 五、SSL配置（HTTPS）

### 1. 安装Certbot

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 申请SSL证书
certbot --nginx -d 你的域名
```

### 2. 自动续期证书

```bash
# 测试自动续期
certbot renew --dry-run
```

## 六、数据库备份策略

设置定时任务备份SQLite数据库：

```bash
# 创建备份脚本
cat > /var/www/kaoyan-buddy/backup.sh << EOL
#!/bin/bash
DATE=\$(date +%Y%m%d)
BACKUP_DIR=/var/backups/kaoyan-buddy
mkdir -p \$BACKUP_DIR
cp /var/www/kaoyan-buddy/server/database.sqlite \$BACKUP_DIR/database_\$DATE.sqlite
find \$BACKUP_DIR -type f -name "database_*.sqlite" -mtime +7 -delete
EOL

# 设置执行权限
chmod +x /var/www/kaoyan-buddy/backup.sh

# 添加到crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/kaoyan-buddy/backup.sh") | crontab -
```

## 七、后续维护

### 1. 代码更新流程

```bash
cd /var/www/kaoyan-buddy
git pull

# 更新后端
cd server
npm install
npm run build
pm2 restart kaoyan-backend

# 更新前端
cd ../client
npm install
npm run build

# 重启Nginx
systemctl restart nginx
```

### 2. 监控设置

```bash
# 查看PM2状态
pm2 status
pm2 logs kaoyan-backend

# 设置PM2监控
pm2 install pm2-logrotate
```

## 八、故障排除

1. **Nginx 502错误**
   - 检查后端服务是否运行：`pm2 status`
   - 检查端口是否正确：`netstat -tulpn | grep 5001`

2. **数据库连接问题**
   - 检查数据库文件权限：`ls -la /var/www/kaoyan-buddy/server/database.sqlite`
   - 修复权限：`chown -R www-data:www-data /var/www/kaoyan-buddy/server/database.sqlite`

3. **文件上传问题**
   - 检查上传目录权限：`ls -la /var/www/kaoyan-buddy/server/uploads`
   - 修复权限：`chown -R www-data:www-data /var/www/kaoyan-buddy/server/uploads`

## 九、性能优化

1. **启用Nginx缓存**
   ```nginx
   location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
       expires 7d;
       add_header Cache-Control "public, max-age=604800";
   }
   ```

2. **启用Gzip压缩**
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_proxied expired no-cache no-store private auth;
   gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
   ```

## 十、成本估算

- ECS实例：约¥100-200/月（2核4GB）
- 域名：约¥60/年（.com域名）
- 备案费用：免费（时间成本约2-4周）
- SSL证书：Let's Encrypt免费

总计：首年约¥1300-2500 