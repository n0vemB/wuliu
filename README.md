# 国际物流报价系统

一个智能的国际物流报价系统，支持自然语言输入解析和多渠道价格对比。

## 🌟 主要功能

- **智能文本解析**：支持自然语言输入，自动提取物流信息
- **多渠道报价**：支持31个不同的物流渠道
- **价格对比**：自动计算并对比不同渠道的价格
- **附加费用计算**：包含偏远费、燃油费、超大件费等
- **RESTful API**：提供完整的API接口
- **Web界面**：简洁易用的前端界面

## 📦 支持的输入格式

### 示例1：阿鲁巴联邦快递
```
25*25*18 6.6KG Country Aruba City Oranjestad Address Hooiberg 64 Postal Code 0000 请计算一下 联邦快递
```

### 示例2：加拿大窗帘轨道
```
加拿大，3221 Redpath Circle,mississauga Ontario产品:窗帘轨道材质:铝合金抛货 -1件尺寸:185CM*35CM*40CM海派报价:快递报价:
```

### 示例3：美国洛杉矶
```
美国洛杉矶 90210 30*20*15 8.5kg DHL快递
```

## 🚀 快速开始

### 1. 环境要求
- Node.js 14+
- MySQL 5.7+
- npm 或 yarn

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `.env` 文件并修改数据库配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=logistics_pricing
PORT=3000
EXCEL_FILE_PATH=./修正星巢国际通全球报价表2025 年7月20生效直客.xlsx
```

### 4. 初始化数据库
```bash
npm run init-db
```

### 5. 导入Excel数据
```bash
npm run import-excel
```

### 6. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 7. 访问系统
- Web界面：http://localhost:3000/public/index.html
- API文档：http://localhost:3000/health

## 📚 API接口

### 1. 健康检查
```http
GET /health
```

### 2. 文本解析
```http
POST /api/parse
Content-Type: application/json

{
  "text": "25*25*18 6.6KG Country Aruba City Oranjestad"
}
```

### 3. 物流报价
```http
POST /api/quote
Content-Type: application/json

{
  "text": "美国洛杉矶 90210 30*20*15 8.5kg",
  "params": {
    "originCity": "深圳"
  }
}
```

### 4. 智能对话报价
```http
POST /api/chat-quote
Content-Type: application/json

{
  "message": "美国洛杉矶 90210 30*20*15 8.5kg DHL快递"
}
```

### 5. 获取支持的国家
```http
GET /api/countries
```

### 6. 获取物流渠道
```http
GET /api/channels?country=USA
```

## 🧪 测试

### 运行文本解析测试
```bash
node test/test-parser.js
```

### 测试用例
系统包含多个测试用例，涵盖不同的输入格式和场景。

## 📊 数据库结构

### 主要数据表
- `logistics_channels` - 物流渠道
- `postal_zones` - 邮编分区
- `origin_ports` - 起运港口
- `pricing` - 价格表
- `special_rules` - 特殊规则

### 支持的渠道类型
- 海运 (Sea Shipping)
- 空运 (Air Shipping)
- 铁路 (Railway)
- 卡航 (Truck)
- 快递 (Express)

## 🌍 支持的国家/地区

- 美国 (USA)
- 加拿大 (Canada)
- 英国 (UK)
- 欧洲各国 (Europe)
- 澳洲 (Australia)
- 新西兰 (New Zealand)
- 阿联酋 (UAE)
- 沙特阿拉伯 (Saudi Arabia)
- 日韩 (Japan/Korea)
- 瑞士 (Switzerland)
- 挪威 (Norway)
- 墨西哥 (Mexico)
- 塞尔维亚 (Serbia)
- 阿鲁巴 (Aruba)

## 🔧 核心功能

### 智能文本解析
- 尺寸识别：支持多种格式 (25*25*18, 25x25x18, 25CM*25CM*18CM)
- 重量识别：支持kg、公斤等单位
- 地址解析：自动提取国家、城市、地址、邮编
- 物流方式识别：联邦快递、DHL、UPS、海派、空派等

### 价格计算
- 体积重量计算：长×宽×高÷6000
- 计费重量：取实重和体积重量的较大值
- 分区定价：根据邮编自动匹配价格分区
- 附加费用：偏远费、燃油费、超大件费等

### 报价结果
- 多渠道对比：显示所有可用渠道的价格
- 详细费用：基础运费+附加费用明细
- 时效信息：预计运输时间
- 服务特色：包税、派送到门等服务

## 🛠️ 技术栈

- **后端**：Node.js + Express
- **数据库**：MySQL
- **文本处理**：Natural.js
- **Excel处理**：XLSX
- **前端**：原生HTML/CSS/JavaScript

## 📝 开发说明

### 添加新的物流渠道
1. 在Excel文件中添加新的工作表
2. 运行 `npm run import-excel` 重新导入数据
3. 更新文本解析器的关键词映射

### 扩展支持的国家
1. 在 `textParser.js` 中添加国家映射
2. 在 `postal_zones` 表中添加邮编分区规则
3. 更新Excel数据

### 自定义附加费用规则
1. 在 `special_rules` 表中添加规则
2. 在 `pricingService.js` 中实现计算逻辑

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请联系开发团队。
