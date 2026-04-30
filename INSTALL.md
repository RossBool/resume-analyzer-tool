# 安装部署指南

## 环境要求

### 后端
- PHP 8.3+
- Composer
- Nginx/Apache (可选，生产环境推荐)

### 前端
- Node.js 18+
- npm 或 yarn

## 安装步骤

### 1. 后端安装

```bash
cd backend

# 安装依赖
composer install

# 复制环境配置文件
cp .env.example .env

# 编辑 .env 文件，配置 AI API 密钥
# AI_API_KEY=your_api_key_here

# 启动开发服务器
php start.php start
```

后端服务将运行在 http://localhost:8787

### 2. 前端安装

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 http://localhost:3000

## 生产环境部署

### 后端部署

1. 使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

2. 使用 Supervisor 管理 webman 进程：

```ini
[program:resume-analyzer]
command=/usr/bin/php /path/to/backend/start.php start
directory=/path/to/backend
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/resume-analyzer.log
```

### 前端部署

```bash
cd frontend

# 构建生产版本
npm run build

# 将 dist 目录部署到 Nginx 或其他 Web 服务器
```

## AI API 配置

本工具使用智谱AI的GLM-4.7模型进行分析。

1. 访问 https://open.bigmodel.cn/ 获取 API Key
2. 在 backend/.env 文件中配置：

```
AI_API_KEY=your_api_key_here
AI_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
AI_MODEL=glm-4-plus
```

## 测试

### 后端测试

```bash
cd backend

# 测试文件上传
curl -X POST http://localhost:8787/api/resume/upload \
  -F "resume=@test.pdf"

# 测试健康检查
curl http://localhost:8787/api/health
```

### 前端测试

访问 http://localhost:3000，按照界面提示上传简历进行分析。

## 常见问题

1. **上传文件失败**
   - 检查文件大小是否超过 10MB
   - 检查文件格式是否为 PDF、DOC、DOCX
   - 检查 uploads 目录是否有写权限

2. **AI分析失败**
   - 检查 API Key 是否正确配置
   - 检查网络连接是否正常
   - 查看后端日志了解详细错误

3. **前端无法连接后端**
   - 检查后端服务是否正常运行
   - 检查 vite.config.js 中的代理配置

## 性能优化建议

1. 启用 OPcache 加速 PHP
2. 使用 Redis 缓存分析结果
3. 配置 CDN 加速前端资源
4. 启用 Nginx gzip 压缩

## 安全建议

1. 定期更新依赖包
2. 限制文件上传大小和类型
3. 使用 HTTPS 加密传输
4. 配置防火墙限制访问
5. 定期备份数据库和文件
