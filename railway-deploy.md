# 🚀 Railway部署指南

## 📋 部署前准备

### 1. 注册Railway账号
- 访问 [railway.app](https://railway.app)
- 使用GitHub账号登录
- 完成邮箱验证

### 2. 准备项目文件
确保项目包含以下文件：
- ✅ `package.json` - 项目配置
- ✅ `app.js` - 主应用文件
- ✅ `Procfile` - 启动命令
- ✅ `railway.json` - Railway配置
- ✅ 所有源代码文件

## 🚀 部署步骤

### 步骤1：连接GitHub仓库
1. 在Railway控制台点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的项目仓库
4. 点击 "Deploy Now"

### 步骤2：配置环境变量
在Railway项目设置中添加以下环境变量：

```bash
# 基础配置
NODE_ENV=production
PORT=3000

# 数据库配置（可选，使用Railway PostgreSQL）
DATABASE_URL=postgresql://username:password@host:port/database

# AI服务配置（可选）
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
```

### 步骤3：配置数据库
Railway会自动提供PostgreSQL数据库：

1. 在项目页面点击 "Add Database"
2. 选择 "PostgreSQL"
3. 等待数据库创建完成
4. 复制数据库连接字符串到 `DATABASE_URL` 环境变量

### 步骤4：部署设置
Railway会自动检测到：
- ✅ Node.js项目
- ✅ 使用 `package.json` 中的 `start` 脚本
- ✅ 监听 `PORT` 环境变量

## 🔧 项目配置

### 1. 数据库迁移
如果使用PostgreSQL，需要修改数据库配置：

```javascript
// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### 2. 静态文件配置
确保静态文件路径正确：

```javascript
// app.js
app.use('/public', express.static('public'));
app.get('/', (req, res) => {
    res.redirect('/public/index.html');
});
```

## 📊 监控和维护

### 1. 查看日志
- 在Railway控制台查看实时日志
- 监控应用状态和错误信息

### 2. 性能监控
- 查看CPU和内存使用情况
- 监控网络流量
- 设置告警通知

### 3. 自动部署
- 每次Git推送自动触发部署
- 支持分支部署
- 回滚到之前版本

## 💰 成本控制

### 1. 资源使用监控
- 在Railway控制台查看资源使用情况
- 设置使用量告警
- 预估月度费用

### 2. 优化建议
```bash
# 减少内存使用
- 优化图片和静态资源
- 使用CDN加速
- 启用压缩

# 减少CPU使用
- 添加缓存机制
- 优化数据库查询
- 使用连接池
```

## 🔒 安全配置

### 1. 环境变量安全
- 不要在代码中硬编码敏感信息
- 使用Railway的环境变量管理
- 定期轮换API密钥

### 2. HTTPS配置
- Railway自动提供HTTPS
- 支持自定义域名
- SSL证书自动续期

## 🚨 故障排除

### 常见问题：

#### 1. 应用启动失败
```bash
# 检查日志
- 查看启动日志
- 检查环境变量
- 验证依赖安装

# 常见错误
- 端口配置错误
- 环境变量缺失
- 依赖版本冲突
```

#### 2. 数据库连接失败
```bash
# 检查数据库配置
- 验证DATABASE_URL
- 检查SSL设置
- 确认数据库状态
```

#### 3. 静态文件404
```bash
# 检查文件路径
- 确认public目录存在
- 检查express.static配置
- 验证文件权限
```

## 📈 性能优化

### 1. 数据库优化
```javascript
// 使用连接池
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

### 2. 缓存策略
```javascript
// 添加Redis缓存
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
```

### 3. 静态资源优化
```javascript
// 启用压缩
const compression = require('compression');
app.use(compression());
```

## 🎯 部署检查清单

### 部署前检查：
- [ ] 代码已提交到GitHub
- [ ] 环境变量已配置
- [ ] 数据库连接正常
- [ ] 静态文件路径正确
- [ ] 依赖包已安装

### 部署后检查：
- [ ] 应用正常启动
- [ ] 数据库连接成功
- [ ] API接口正常响应
- [ ] 前端页面可访问
- [ ] 日志无错误信息

## 📞 技术支持

### Railway支持：
- 官方文档：https://docs.railway.app
- 社区论坛：https://railway.app/community
- 邮件支持：support@railway.app

### 项目支持：
- 查看项目README
- 检查GitHub Issues
- 联系项目维护者

---

## 🎉 部署完成！

恭喜！您的国际物流报价系统已成功部署到Railway。

**访问地址：** `https://your-project-name.railway.app`

**管理面板：** Railway控制台

**监控地址：** Railway项目页面

现在您可以：
- ✅ 通过HTTPS访问应用
- ✅ 使用Railway的数据库
- ✅ 享受自动部署
- ✅ 监控应用性能
- ✅ 管理环境变量

祝您使用愉快！🚀