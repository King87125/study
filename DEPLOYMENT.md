# 考研伴侣网站部署文档

本文档提供了将考研伴侣网站部署到阿里云的说明和步骤。

## 部署准备

在开始部署之前，请确保你已经：

1. 注册了阿里云账号并完成实名认证
2. 购买了合适的ECS云服务器
3. （可选）购买并备案了域名

## 部署方法

有两种方式可以部署考研伴侣网站：

### 方法一：使用自动部署脚本（推荐）

1. 首先，将代码仓库克隆到本地：
   ```bash
   git clone https://github.com/King87125/study.git
   cd study
   ```

2. 修改部署脚本中的域名或IP地址：
   ```bash
   # 打开deploy.sh
   # 找到并修改以下行
   DOMAIN_OR_IP="your_domain_or_ip" # 请替换为你的域名或IP地址
   ```

3. 将修改后的部署脚本上传到阿里云服务器：
   ```bash
   scp deploy.sh root@您的服务器IP:/root/
   ```

4. 连接到服务器并运行部署脚本：
   ```bash
   ssh root@您的服务器IP
   cd /root
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. 等待脚本完成部署过程。脚本会自动：
   - 安装所有必需的软件和依赖
   - 克隆项目代码
   - 配置并启动后端服务
   - 构建前端应用
   - 设置Nginx
   - 配置自动备份

### 方法二：按照部署指南手动部署

如果你希望对部署过程有更多控制，可以参照 `deployment-guide.md` 文件中的详细步骤进行手动部署。

## 部署后的维护

### 更新应用

当有新的代码更新时，你可以在服务器上运行以下命令来更新应用：

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

### 监控应用

你可以使用以下命令来监控应用状态：

```bash
# 查看后端服务状态
pm2 status
pm2 logs kaoyan-backend

# 查看Nginx状态
systemctl status nginx
```

### 备份和恢复

系统已配置每天凌晨2点自动备份数据库。备份文件存储在 `/var/backups/kaoyan-buddy/` 目录中。

如需手动备份，可运行：
```bash
/var/www/kaoyan-buddy/backup.sh
```

如需恢复备份，可运行：
```bash
# 停止后端服务
pm2 stop kaoyan-backend

# 恢复数据库文件
cp /var/backups/kaoyan-buddy/database_YYYYMMDD.sqlite /var/www/kaoyan-buddy/server/database.sqlite

# 设置正确的权限
chown www-data:www-data /var/www/kaoyan-buddy/server/database.sqlite
chmod 644 /var/www/kaoyan-buddy/server/database.sqlite

# 重启后端服务
pm2 start kaoyan-backend
```

## 故障排除

如果你遇到部署或运行问题，请查阅 `deployment-guide.md` 文件中的"故障排除"部分。

常见问题包括：
1. 无法访问网站 - 检查Nginx和后端服务是否正常运行
2. 上传功能不工作 - 检查上传目录权限
3. 数据库错误 - 检查数据库文件权限

## 安全建议

1. 定期更新服务器系统和应用依赖
2. 启用防火墙，只开放必要的端口
3. 使用强密码并定期更换
4. 考虑设置HTTPS以加密数据传输

## 联系支持

如果你在部署过程中遇到任何问题，请通过GitHub仓库提交Issue，或联系管理员寻求帮助。 