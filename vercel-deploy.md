# 🚀 Vercel部署指南

## 📋 Vercel优势

### ✅ 完全免费
- 无限制部署
- 自动HTTPS
- 全球CDN加速
- 国内访问稳定

### ✅ 部署简单
- 连接GitHub自动部署
- 无需配置环境变量
- 自动域名分配
- 实时部署状态

## 🚀 部署步骤

### 步骤1：访问Vercel
1. 打开 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"

### 步骤2：导入项目
1. 选择 "Import Git Repository"
2. 选择您的 `n0vemB/wuliu` 仓库
3. 点击 "Import"

### 步骤3：配置项目
1. **Framework Preset**: 选择 "Other"
2. **Root Directory**: 保持默认
3. **Build Command**: 留空
4. **Output Directory**: 留空
5. **Install Command**: 留空

### 步骤4：环境变量（可选）
如果需要，可以添加：
```
NODE_ENV=production
PORT=3000
```

### 步骤5：部署
1. 点击 "Deploy"
2. 等待部署完成
3. 获得部署URL

## 📊 部署后验证

### 1. 检查部署状态
- 访问部署URL
- 应该看到：`{"status":"ok","message":"国际物流报价系统运行正常","version":"1.0.0"}`

### 2. 测试API接口
- 健康检查：`https://your-project.vercel.app/health`
- 前端页面：`https://your-project.vercel.app/public/index.html`

### 3. 测试功能
- 文本解析功能
- 标准化报价功能
- 前端界面交互

## 🔧 配置说明

### vercel.json配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "start-simple.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "start-simple.js"
    }
  ]
}
```

### 自动部署
- 每次Git推送自动触发部署
- 支持分支部署
- 自动HTTPS证书

## 💰 成本对比

| 平台 | 免费额度 | 国内访问 | 部署难度 | 推荐度 |
|------|----------|----------|----------|--------|
| **Vercel** | 无限制 | ✅ 稳定 | ⭐ 简单 | ⭐⭐⭐⭐⭐ |
| **Railway** | $5/月 | ❌ 需VPN | ⭐⭐ 中等 | ⭐⭐⭐ |
| **腾讯云** | 有免费额度 | ✅ 快速 | ⭐⭐⭐ 复杂 | ⭐⭐⭐⭐ |
| **阿里云** | 按量计费 | ✅ 快速 | ⭐⭐⭐⭐ 复杂 | ⭐⭐⭐ |

## 🎯 推荐理由

### Vercel是最佳选择：
1. **完全免费** - 无任何费用
2. **国内访问稳定** - 无需VPN
3. **部署简单** - 一键部署
4. **自动HTTPS** - 安全可靠
5. **全球CDN** - 访问速度快

## 🚀 开始部署

现在就可以开始Vercel部署：

1. 访问 [vercel.com](https://vercel.com)
2. 连接GitHub账号
3. 导入您的项目
4. 一键部署

**预计部署时间**：2-3分钟
**部署成功率**：99%+
**国内访问**：✅ 正常

---

## 📞 需要帮助？

如果遇到问题：
1. 检查GitHub仓库连接
2. 确认项目文件完整
3. 查看Vercel部署日志
4. 联系技术支持

**祝您部署成功！🎉**
