#!/usr/bin/env node

// Railway专用启动脚本
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/sqlite-database');
const TextParser = require('./utils/textParser');
const PricingService = require('./services/pricingService');
const StandardPricingService = require('./services/standardPricingService');
const AIService = require('./services/aiService');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化服务
const textParser = new TextParser();
const pricingService = new PricingService();
const standardPricingService = new StandardPricingService();
const aiService = new AIService();

// 简化的健康检查接口
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// 根路径
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        message: '国际物流报价系统运行正常'
    });
});

// 静态文件服务
app.use('/public', express.static('public'));

// 启动服务器
async function startServer() {
    try {
        console.log('🚀 启动国际物流报价系统...');
        
        app.listen(port, '0.0.0.0', () => {
            console.log(`✅ 服务器启动成功`);
            console.log(`📡 端口: ${port}`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();
