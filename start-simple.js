#!/usr/bin/env node

// Railway专用简化启动脚本 - 无数据库版本
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 简化的健康检查接口
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: '国际物流报价系统'
    });
});

// 根路径
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        message: '国际物流报价系统运行正常',
        version: '1.0.0'
    });
});

// 文本解析接口（简化版）
app.post('/api/parse', (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: '请提供要解析的文本'
            });
        }

        // 简单的文本解析逻辑
        const result = {
            original: text,
            parsed: {
                text: text,
                timestamp: new Date().toISOString()
            },
            formatted: `解析结果: ${text}`
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('文本解析失败:', error);
        res.status(500).json({
            success: false,
            message: '文本解析失败',
            error: error.message
        });
    }
});

// 标准化报价接口（简化版）
app.post('/api/standard-quote', (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供查询信息'
            });
        }

        // 模拟报价结果
        const mockQuote = {
            channelName: '标准物流渠道',
            serviceType: 'express',
            transitTime: '5-7天',
            basePrice: 100,
            totalPrice: 120,
            currency: 'CNY'
        };

        res.json({
            success: true,
            data: {
                type: 'standard_quote_result',
                message: `模拟报价结果：\n\n渠道: ${mockQuote.channelName}\n服务: ${mockQuote.serviceType}\n时效: ${mockQuote.transitTime}\n价格: ¥${mockQuote.totalPrice}`,
                quotes: [mockQuote],
                count: 1
            }
        });
    } catch (error) {
        console.error('标准化报价失败:', error);
        res.status(500).json({
            success: false,
            message: '标准化报价服务暂时不可用',
            error: error.message
        });
    }
});

// 静态文件服务
app.use('/public', express.static('public'));

// 启动服务器
async function startServer() {
    try {
        console.log('🚀 启动国际物流报价系统（简化版）...');
        
        app.listen(port, '0.0.0.0', () => {
            console.log(`✅ 服务器启动成功`);
            console.log(`📡 端口: ${port}`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 服务状态: 运行中`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();
