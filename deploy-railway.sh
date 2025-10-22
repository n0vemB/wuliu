#!/bin/bash

# 🚀 Railway部署脚本
# 使用方法: ./deploy-railway.sh

echo "🚀 开始Railway部署流程..."

# 检查必要文件
echo "📋 检查必要文件..."

required_files=(
    "package.json"
    "app.js"
    "Procfile"
    "railway.json"
    "public/index.html"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    else
        echo "✅ $file 存在"
    fi
done

# 检查Git状态
echo "📋 检查Git状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改，请先提交代码："
    git status --short
    echo ""
    echo "请运行以下命令提交代码："
    echo "git add ."
    echo "git commit -m '准备部署到Railway'"
    echo "git push origin main"
    exit 1
else
    echo "✅ Git状态干净"
fi

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node --version)
echo "✅ Node.js版本: $node_version"

# 检查依赖
echo "📋 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

# 本地测试
echo "📋 本地测试..."
echo "启动本地服务器进行测试..."
timeout 10s npm start > /dev/null 2>&1 &
server_pid=$!
sleep 5

# 测试健康检查接口
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 本地测试通过"
    kill $server_pid 2>/dev/null
else
    echo "❌ 本地测试失败，请检查应用配置"
    kill $server_pid 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 部署前检查完成！"
echo ""
echo "📋 下一步操作："
echo "1. 访问 https://railway.app"
echo "2. 点击 'New Project'"
echo "3. 选择 'Deploy from GitHub repo'"
echo "4. 选择您的项目仓库"
echo "5. 点击 'Deploy Now'"
echo ""
echo "📋 部署后配置："
echo "1. 在Railway项目设置中添加环境变量："
echo "   - NODE_ENV=production"
echo "   - PORT=3000"
echo "2. 添加PostgreSQL数据库（可选）"
echo "3. 配置AI服务密钥（可选）"
echo ""
echo "📋 验证部署："
echo "1. 检查应用启动状态"
echo "2. 访问健康检查接口: /health"
echo "3. 测试API接口: /api/parse"
echo "4. 访问前端页面"
echo ""
echo "🚀 祝您部署成功！"
