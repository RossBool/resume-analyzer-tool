#!/bin/bash
# 开发环境启动脚本

echo "🚀 启动简历分析工具后端服务..."

cd "$(dirname "$0")"

# 检查 uploads 目录
if [ ! -d "public/uploads" ]; then
    mkdir -p public/uploads
    echo "✓ 创建上传目录"
fi

# 启动 PHP 内置服务器
echo "✓ 后端服务启动在 http://localhost:8787"
echo "按 Ctrl+C 停止服务"

php83 -S localhost:8787 -t public public/router.php
