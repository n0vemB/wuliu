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

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: '国际物流报价系统'
    });
});

// 文本解析接口
app.post('/api/parse', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: '请提供要解析的文本'
            });
        }

        const parseResult = textParser.parseUserInput(text);
        const formattedResult = textParser.formatResult(parseResult);

        res.json({
            success: true,
            data: {
                original: text,
                parsed: parseResult,
                formatted: formattedResult
            }
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

// 物流报价接口
app.post('/api/quote', async (req, res) => {
    try {
        // 检查数据库连接
        const dbConnected = await testConnection();
        if (!dbConnected) {
            return res.status(503).json({
                success: false,
                message: '数据库服务不可用，无法提供报价功能。请联系管理员或稍后重试。'
            });
        }

        const { text, params } = req.body;

        let queryParams = params;

        // 如果提供了文本，先进行解析
        if (text) {
            const parseResult = textParser.parseUserInput(text);

            if (!parseResult.isSuccess) {
                return res.status(400).json({
                    success: false,
                    message: '文本解析失败，请检查输入格式',
                    errors: parseResult.errors
                });
            }

            // 将解析结果转换为查询参数
            queryParams = {
                country: parseResult.country,
                city: parseResult.city,
                postalCode: parseResult.postalCode,
                weight: parseResult.weight,
                dimensions: parseResult.dimensions,
                shippingMethods: parseResult.shippingMethods,
                productInfo: parseResult.productInfo,
                material: parseResult.material,
                quantity: parseResult.quantity,
                address: parseResult.address,
                ...params // 允许参数覆盖解析结果
            };
        }

        // 验证必要参数
        if (!queryParams.country && !queryParams.weight && !queryParams.dimensions) {
            return res.status(400).json({
                success: false,
                message: '请提供国家、重量或尺寸信息'
            });
        }

        // 计算报价
        const quotes = await pricingService.calculatePricing(queryParams);
        const formattedQuotes = pricingService.formatQuotes(quotes);

        res.json({
            success: true,
            data: {
                params: queryParams,
                quotes: quotes,
                formatted: formattedQuotes,
                count: quotes.length
            }
        });
    } catch (error) {
        console.error('报价计算失败:', error);
        res.status(500).json({
            success: false,
            message: '报价计算失败',
            error: error.message
        });
    }
});

// AI增强报价接口
app.post('/api/ai-quote', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供查询信息'
            });
        }

        // 检查AI服务状态
        const aiStatus = aiService.getStatus();
        if (!aiStatus.hasApiKey) {
            return res.json({
                success: true,
                data: {
                    type: 'ai_unavailable',
                    message: 'AI服务未配置，请设置 OPENAI_API_KEY 或 CLAUDE_API_KEY 环境变量后重启服务。\n\n' +
                            '配置方法：\n' +
                            '1. 复制 .env 文件\n' +
                            '2. 添加 OPENAI_API_KEY=your_key 或 CLAUDE_API_KEY=your_key\n' +
                            '3. 重启服务\n\n' +
                            '目前使用传统解析方式为您服务。',
                    fallbackAvailable: true
                }
            });
        }

        try {
            // 使用AI进行报价
            const aiResult = await aiService.getAIQuote(message);

            if (aiResult.success === false) {
                // AI失败，降级到传统方式
                return await handleTraditionalQuote(req, res);
            }

            return res.json({
                success: true,
                data: {
                    type: 'ai_quote_result',
                    message: `🤖 AI智能报价结果：\n\n${formatAIQuote(aiResult)}`,
                    aiResult: aiResult,
                    provider: aiStatus.provider,
                    count: aiResult.quotes ? aiResult.quotes.length : 0
                }
            });
        } catch (error) {
            console.error('AI报价失败，降级到传统方式:', error);
            // AI失败，降级到传统方式
            return await handleTraditionalQuote(req, res);
        }
    } catch (error) {
        console.error('AI报价接口失败:', error);
        res.status(500).json({
            success: false,
            message: 'AI报价服务暂时不可用',
            error: error.message
        });
    }
});

// 传统报价处理函数
async function handleTraditionalQuote(req, res) {
    // 这里复用原来的chat-quote逻辑
    const { message } = req.body;

    // 解析用户输入
    const parseResult = textParser.parseUserInput(message);

    if (!parseResult.isSuccess) {
        return res.json({
            success: true,
            data: {
                type: 'parse_error',
                message: '抱歉，我无法理解您的查询。请提供更详细的信息，例如：\n\n' +
                        '• 目的国家和城市\n' +
                        '• 货物重量或尺寸\n' +
                        '• 邮编（如有）\n' +
                        '• 物流方式偏好（如有）\n\n' +
                        '示例：Country Aruba，City Oranjestad，Address Hooiberg 64，Postal Code 0000，25*25*18 6.6KG',
                parsed: parseResult
            }
        });
    }

    // 检查数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
        return res.json({
            success: true,
            data: {
                type: 'parse_success_db_error',
                message: `我已成功解析您的查询信息：\n\n${textParser.formatResult(parseResult)}\n\n` +
                        '但是数据库服务暂时不可用，无法提供具体报价。\n' +
                        '请联系客服获取人工报价，或稍后重试。',
                parsed: parseResult,
                quotes: [],
                count: 0
            }
        });
    }

    // 计算报价
    const queryParams = {
        country: parseResult.country,
        city: parseResult.city,
        postalCode: parseResult.postalCode,
        weight: parseResult.weight,
        dimensions: parseResult.dimensions,
        shippingMethods: parseResult.shippingMethods,
        productInfo: parseResult.productInfo,
        material: parseResult.material,
        quantity: parseResult.quantity,
        address: parseResult.address
    };

    const quotes = await pricingService.calculatePricing(queryParams);

    let responseMessage = '';

    if (quotes.length === 0) {
        responseMessage = '抱歉，暂时没有找到合适的物流渠道。\n\n' +
                        '可能的原因：\n' +
                        '• 目的地暂不支持\n' +
                        '• 货物规格超出限制\n' +
                        '• 价格数据未录入\n\n' +
                        '请联系客服获取人工报价。';
    } else {
        responseMessage = `根据您的查询信息：\n`;
        responseMessage += textParser.formatResult(parseResult) + '\n\n';
        responseMessage += pricingService.formatQuotes(quotes);

        if (parseResult.shippingMethods.length > 0) {
            responseMessage += `\n💡 您指定的物流方式：${parseResult.shippingMethods.join(', ')}`;
        }
    }

    return res.json({
        success: true,
        data: {
            type: 'traditional_quote_result',
            message: responseMessage,
            parsed: parseResult,
            quotes: quotes,
            count: quotes.length
        }
    });
}

// 格式化AI报价结果
function formatAIQuote(aiResult) {
    if (!aiResult.quotes || aiResult.quotes.length === 0) {
        return aiResult.message || '暂无可用报价';
    }

    let result = '';

    if (aiResult.parsed) {
        result += '📋 解析信息：\n';
        const parsed = aiResult.parsed;
        if (parsed.country) result += `国家: ${parsed.country}\n`;
        if (parsed.city) result += `城市: ${parsed.city}\n`;
        if (parsed.address) result += `地址: ${parsed.address}\n`;
        if (parsed.postalCode) result += `邮编: ${parsed.postalCode}\n`;
        if (parsed.dimensions) result += `尺寸: ${parsed.dimensions.length}×${parsed.dimensions.width}×${parsed.dimensions.height}cm\n`;
        if (parsed.weight) result += `重量: ${parsed.weight}kg\n`;
        if (parsed.productType) result += `产品: ${parsed.productType}\n`;
        result += '\n';
    }

    result += '📦 AI智能报价：\n\n';

    aiResult.quotes.forEach((quote, index) => {
        result += `${index + 1}. ${quote.channelName}\n`;
        if (quote.serviceType) result += `   服务类型: ${quote.serviceType}\n`;
        if (quote.transitTime) result += `   运输时效: ${quote.transitTime}\n`;
        if (quote.chargeableWeight) result += `   计费重量: ${quote.chargeableWeight}kg\n`;
        if (quote.pricePerKg) result += `   单价: ¥${quote.pricePerKg}/kg\n`;
        if (quote.totalPrice) result += `   总价: ¥${quote.totalPrice.toFixed(2)}\n`;
        if (quote.features && quote.features.length > 0) {
            result += `   特色服务: ${quote.features.join(', ')}\n`;
        }
        if (quote.restrictions && quote.restrictions.length > 0) {
            result += `   限制条件: ${quote.restrictions.join(', ')}\n`;
        }
        result += '\n';
    });

    if (aiResult.recommendations) {
        result += `💡 AI建议: ${aiResult.recommendations}\n\n`;
    }

    if (aiResult.notes) {
        result += `⚠️ 重要提醒: ${aiResult.notes}`;
    }

    return result;
}

// 标准化报价接口
app.post('/api/standard-quote', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供查询信息'
            });
        }

        // 解析用户输入
        const parseResult = textParser.parseUserInput(message);

        if (!parseResult.isSuccess) {
            return res.json({
                success: true,
                data: {
                    type: 'parse_error',
                    message: '抱歉，我无法理解您的查询。请提供更详细的信息，例如：\n\n' +
                            '• 目的国家和城市\n' +
                            '• 货物重量或尺寸\n' +
                            '• 邮编（如有）\n' +
                            '• 物流方式偏好（如有）\n\n' +
                            '示例：Country Aruba，City Oranjestad，Address Hooiberg 64，Postal Code 0000，25*25*18 6.6KG',
                    parsed: parseResult
                }
            });
        }

        // 使用标准化计价服务
        const queryParams = {
            country: parseResult.country,
            city: parseResult.city,
            postalCode: parseResult.postalCode,
            weight: parseResult.weight,
            dimensions: parseResult.dimensions,
            shippingMethods: parseResult.shippingMethods,
            productInfo: parseResult.productInfo,
            material: parseResult.material,
            quantity: parseResult.quantity,
            address: parseResult.address,
            customPrice: parseResult.customPrice
        };

        const quotes = await standardPricingService.calculateStandardPricing(queryParams);

        let responseMessage = '';

        if (quotes.length === 0) {
            responseMessage = '抱歉，暂时没有找到合适的标准化物流渠道。\n\n' +
                            '可能的原因：\n' +
                            '• 目的地暂不支持\n' +
                            '• 货物规格超出限制\n' +
                            '• 重量不在标准范围内\n\n' +
                            '请联系客服获取人工报价。';
        } else {
            responseMessage = `📋 根据标准化报价表为您查询：\n\n`;
            responseMessage += textParser.formatResult(parseResult) + '\n\n';
            responseMessage += standardPricingService.formatStandardQuotes(quotes);

            if (parseResult.shippingMethods.length > 0) {
                responseMessage += `\n💡 您指定的物流方式：${parseResult.shippingMethods.join(', ')}`;
            }

            responseMessage += `\n\n📊 价格基于最新标准化报价表，包含详细的时效和理赔信息`;
        }

        res.json({
            success: true,
            data: {
                type: 'standard_quote_result',
                message: responseMessage,
                parsed: parseResult,
                quotes: quotes,
                count: quotes.length,
                source: 'standard_pricing_table'
            }
        });
    } catch (error) {
        console.error('标准化报价失败:', error);
        res.status(500).json({
            success: false,
            message: '标准化报价服务暂时不可用，请稍后重试',
            error: error.message
        });
    }
});

// 传统报价接口已移除，请使用标准化报价接口

// 获取支持的国家列表
app.get('/api/countries', async (req, res) => {
    try {
        // 检查数据库连接
        const dbConnected = await testConnection();
        if (!dbConnected) {
            return res.status(503).json({
                success: false,
                message: '数据库服务不可用'
            });
        }

        const { query } = require('./config/sqlite-database');
        const querySQL = `
            SELECT DISTINCT destination_country as country, COUNT(*) as channel_count
            FROM logistics_channels
            WHERE is_active = 1
            GROUP BY destination_country
            ORDER BY destination_country
        `;
        const rows = await query(querySQL);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取国家列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取国家列表失败'
        });
    }
});

// AI服务状态接口
app.get('/api/ai-status', (req, res) => {
    try {
        const status = aiService.getStatus();
        res.json({
            success: true,
            data: {
                ...status,
                message: status.hasApiKey ?
                    `AI服务已就绪 (${status.provider.toUpperCase()})` :
                    'AI服务未配置，请设置API密钥'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取AI服务状态失败',
            error: error.message
        });
    }
});

// 地址验证接口
app.post('/api/validate-address', async (req, res) => {
    try {
        const { address, country, postalCode } = req.body;

        if (!address || !country) {
            return res.status(400).json({
                success: false,
                message: '请提供地址和国家信息'
            });
        }

        const validation = await aiService.validateAddress(address, country, postalCode, req.body.city);

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error('地址验证失败:', error);
        res.status(500).json({
            success: false,
            message: '地址验证服务暂时不可用',
            error: error.message
        });
    }
});

// 获取渠道列表
app.get('/api/channels', async (req, res) => {
    try {
        // 检查数据库连接
        const dbConnected = await testConnection();
        if (!dbConnected) {
            return res.status(503).json({
                success: false,
                message: '数据库服务不可用'
            });
        }

        const { country } = req.query;
        const { query } = require('./config/sqlite-database');

        let querySQL = `
            SELECT id, channel_name, channel_type, service_type, transit_time, description
            FROM logistics_channels
            WHERE is_active = 1
        `;
        let params = [];

        if (country) {
            querySQL += ` AND destination_country = ?`;
            params.push(country);
        }

        querySQL += ` ORDER BY channel_type, channel_name`;

        const rows = await query(querySQL, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取渠道列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取渠道列表失败'
        });
    }
});

// 静态文件服务
app.use('/public', express.static('public'));

// 根路径重定向到前端页面
app.get('/', (req, res) => {
    res.redirect('/public/index.html');
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        const dbConnected = await testConnection();

        app.listen(port, () => {
            console.log(`🚀 国际物流报价系统启动成功`);
            console.log(`📡 服务地址: http://localhost:${port}`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);

            if (dbConnected) {
                console.log(`✅ 数据库连接正常`);
                console.log(`📊 完整功能可用:`);
                console.log(`   - POST /api/parse - 文本解析`);
                console.log(`   - POST /api/quote - 物流报价`);
                console.log(`   - POST /api/chat-quote - 智能对话报价`);
                console.log(`   - GET  /api/countries - 支持的国家`);
                console.log(`   - GET  /api/channels - 物流渠道`);
            } else {
                console.log(`⚠️  数据库连接失败，仅文本解析功能可用`);
                console.log(`📊 可用功能:`);
                console.log(`   - POST /api/parse - 文本解析`);
                console.log(`   - 前端界面: http://localhost:${port}`);
            }
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
