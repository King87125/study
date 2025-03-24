#!/bin/bash

# 考研伴侣网站自动部署脚本
# 此脚本应在目标服务器上运行

# 显示彩色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 输出信息函数
info() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# 环境变量设置
APP_DIR="/var/www/kaoyan-buddy"
REPO_URL="https://github.com/King87125/study.git"
DOMAIN_OR_IP="your_domain_or_ip" # 请替换为你的域名或IP地址

# 检查是否为root用户
if [ "$(id -u)" != "0" ]; then
   error "此脚本必须以root用户运行" 
fi

# 检查并安装依赖项
install_dependencies() {
    info "正在安装和更新系统依赖..."
    apt update -qq || error "无法更新软件包列表"
    apt upgrade -y -qq || warn "无法升级软件包"
    
    # 检查并安装Node.js
    if ! command -v node &> /dev/null; then
        info "正在安装Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || error "无法设置Node.js仓库"
        apt install -y nodejs || error "无法安装Node.js"
    else
        info "Node.js已安装: $(node -v)"
    fi
    
    # 检查并安装PM2
    if ! command -v pm2 &> /dev/null; then
        info "正在安装PM2..."
        npm install -g pm2 || error "无法安装PM2"
    else
        info "PM2已安装: $(pm2 -v)"
    fi
    
    # 检查并安装Nginx
    if ! command -v nginx &> /dev/null; then
        info "正在安装Nginx..."
        apt install -y nginx || error "无法安装Nginx"
        systemctl enable nginx || warn "无法设置Nginx开机启动"
    else
        info "Nginx已安装: $(nginx -v 2>&1 | cut -d '/' -f 2)"
    fi
    
    # 检查并安装SQLite3
    if ! command -v sqlite3 &> /dev/null; then
        info "正在安装SQLite3..."
        apt install -y sqlite3 || error "无法安装SQLite3"
    else
        info "SQLite3已安装: $(sqlite3 --version | awk '{print $1}')"
    fi
    
    # 安装其他依赖
    apt install -y git build-essential || warn "无法安装某些依赖项"
    
    info "所有依赖项安装完成。"
}

# 部署后端
deploy_backend() {
    info "开始部署后端服务..."
    
    # 进入应用目录
    cd "$APP_DIR/server" || error "无法进入后端目录"
    
    # 创建环境变量文件
    info "创建环境变量文件..."
    cat > .env << EOL
PORT=5001
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
EOL
    
    # 安装依赖
    info "安装后端依赖..."
    npm install || error "无法安装后端依赖"
    
    # 构建项目
    info "构建后端项目..."
    npm run build || error "无法构建后端项目"
    
    # 启动服务
    info "启动后端服务..."
    pm2 stop kaoyan-backend 2>/dev/null || true
    pm2 start dist/index.js --name kaoyan-backend || error "无法启动后端服务"
    pm2 save || warn "无法保存PM2配置"
    
    info "后端部署完成！"
}

# 部署前端
deploy_frontend() {
    info "开始部署前端应用..."
    
    # 进入前端目录
    cd "$APP_DIR/client" || error "无法进入前端目录"
    
    # 修改API地址
    info "更新API地址配置..."
    sed -i "s|http://localhost:5001|http://$DOMAIN_OR_IP|g" src/utils/axios.ts || warn "无法更新API地址"
    
    # 安装依赖
    info "安装前端依赖..."
    npm install || error "无法安装前端依赖"
    
    # 构建项目
    info "构建前端项目..."
    npm run build || error "无法构建前端项目"
    
    info "前端部署完成！"
}

# 配置Nginx
configure_nginx() {
    info "配置Nginx服务器..."
    
    # 创建Nginx配置文件
    cat > /etc/nginx/sites-available/kaoyan-buddy << EOL
server {
    listen 80;
    server_name $DOMAIN_OR_IP;
    
    # 前端静态文件
    location / {
        root $APP_DIR/client/build;
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
        alias $APP_DIR/server/uploads;
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
EOL
    
    # 启用站点配置
    ln -sf /etc/nginx/sites-available/kaoyan-buddy /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 验证配置
    nginx -t || error "Nginx配置语法错误"
    
    # 重启Nginx
    systemctl restart nginx || error "无法重启Nginx"
    
    info "Nginx配置完成！"
}

# 设置权限
setup_permissions() {
    info "设置文件权限..."
    
    # 设置上传目录权限
    mkdir -p "$APP_DIR/server/uploads" || warn "无法创建上传目录"
    chown -R www-data:www-data "$APP_DIR/server/uploads" || warn "无法更改上传目录权限"
    chmod -R 755 "$APP_DIR/server/uploads" || warn "无法设置上传目录权限"
    
    # 设置数据库文件权限
    touch "$APP_DIR/server/database.sqlite" || warn "无法创建数据库文件"
    chown www-data:www-data "$APP_DIR/server/database.sqlite" || warn "无法更改数据库文件权限"
    chmod 644 "$APP_DIR/server/database.sqlite" || warn "无法设置数据库文件权限"
    
    info "权限设置完成！"
}

# 设置备份
setup_backup() {
    info "设置数据库备份..."
    
    # 创建备份脚本
    cat > "$APP_DIR/backup.sh" << EOL
#!/bin/bash
DATE=\$(date +%Y%m%d)
BACKUP_DIR=/var/backups/kaoyan-buddy
mkdir -p \$BACKUP_DIR
cp $APP_DIR/server/database.sqlite \$BACKUP_DIR/database_\$DATE.sqlite
find \$BACKUP_DIR -type f -name "database_*.sqlite" -mtime +7 -delete
EOL
    
    # 设置执行权限
    chmod +x "$APP_DIR/backup.sh" || warn "无法设置备份脚本执行权限"
    
    # 添加到crontab
    (crontab -l 2>/dev/null | grep -v "$APP_DIR/backup.sh"; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -
    
    info "备份设置完成！"
}

# 主函数
main() {
    info "开始自动部署考研伴侣网站..."
    
    # 安装依赖
    install_dependencies
    
    # 创建应用目录
    mkdir -p "$APP_DIR" || error "无法创建应用目录"
    
    # 克隆代码（如果目录不为空则不克隆）
    if [ -z "$(ls -A $APP_DIR)" ]; then
        info "克隆代码库..."
        git clone "$REPO_URL" "$APP_DIR" || error "无法克隆代码库"
    else
        info "应用目录不为空，跳过克隆步骤。"
        cd "$APP_DIR" || error "无法进入应用目录"
        git pull || warn "无法更新代码库"
    fi
    
    # 部署前端和后端
    deploy_backend
    deploy_frontend
    
    # 设置权限
    setup_permissions
    
    # 配置Nginx
    configure_nginx
    
    # 设置备份
    setup_backup
    
    info "考研伴侣网站部署完成！"
    info "你现在可以通过访问 http://$DOMAIN_OR_IP 来访问网站。"
}

# 执行主函数
main 