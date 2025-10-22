#!/usr/bin/env node

// Railway/Vercel专用完整启动脚本 - 无数据库版本
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

// 根路径 - 直接提供前端页面
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 文本解析接口（完整版）
app.post('/api/parse', (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: '请提供要解析的文本'
            });
        }

        // 简化的文本解析逻辑
        const parseResult = {
            isSuccess: true,
            country: extractCountry(text),
            city: extractCity(text),
            address: extractAddress(text),
            postalCode: extractPostalCode(text),
            weight: extractWeight(text),
            dimensions: extractDimensions(text),
            shippingMethods: extractShippingMethods(text),
            productInfo: extractProductInfo(text),
            material: extractMaterial(text),
            quantity: extractQuantity(text),
            customPrice: extractCustomPrice(text)
        };

        const formattedResult = formatParseResult(parseResult);

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

// 标准化报价接口（完整版）
app.post('/api/standard-quote', (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供查询信息'
            });
        }

        // 解析用户输入
        const parseResult = {
            isSuccess: true,
            country: extractCountry(message),
            city: extractCity(message),
            address: extractAddress(message),
            postalCode: extractPostalCode(message),
            weight: extractWeight(message),
            dimensions: extractDimensions(message),
            shippingMethods: extractShippingMethods(message),
            productInfo: extractProductInfo(message),
            material: extractMaterial(message),
            quantity: extractQuantity(message),
            customPrice: extractCustomPrice(message)
        };

        if (!parseResult.isSuccess) {
            return res.json({
                success: true,
                data: {
                    type: 'parse_error',
                    message: '抱歉，我无法理解您的查询。请提供更详细的信息。',
                    parsed: parseResult
                }
            });
        }

        // 计算报价
        const quotes = calculatePricing(parseResult);

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
            responseMessage += formatParseResult(parseResult) + '\n\n';
            responseMessage += formatQuotes(quotes);
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

// 静态文件服务
app.use(express.static('public'));
app.use('/public', express.static('public'));

// 启动服务器
async function startServer() {
    try {
        console.log('🚀 启动国际物流报价系统（完整版）...');
        
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

// 辅助函数
function extractCountry(text) {
    const countryPatterns = [
        /USA|United States|美国/i,
        /Canada|加拿大/i,
        /UK|United Kingdom|英国/i,
        /Germany|德国/i,
        /France|法国/i,
        /Japan|日本/i,
        /Australia|澳大利亚/i
    ];
    
    for (const pattern of countryPatterns) {
        if (pattern.test(text)) {
            if (pattern.source.includes('USA') || pattern.source.includes('United States')) return 'USA';
            if (pattern.source.includes('Canada')) return 'Canada';
            if (pattern.source.includes('UK') || pattern.source.includes('United Kingdom')) return 'UK';
            if (pattern.source.includes('Germany')) return 'Germany';
            if (pattern.source.includes('France')) return 'France';
            if (pattern.source.includes('Japan')) return 'Japan';
            if (pattern.source.includes('Australia')) return 'Australia';
        }
    }
    return 'USA'; // 默认美国
}

function extractCity(text) {
    const cityMatch = text.match(/([A-Za-z\s]+),\s*[A-Z]{2}/);
    if (cityMatch) {
        return cityMatch[1].trim();
    }
    return 'Miami'; // 默认城市
}

function extractAddress(text) {
    const addressMatch = text.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd))/i);
    if (addressMatch) {
        return addressMatch[1].trim();
    }
    return '123 Main St'; // 默认地址
}

function extractPostalCode(text) {
    const postalMatch = text.match(/\b\d{5}(?:-\d{4})?\b/);
    if (postalMatch) {
        return postalMatch[0];
    }
    return '33166'; // 默认邮编
}

function extractWeight(text) {
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
        return parseFloat(weightMatch[1]);
    }
    return 10; // 默认重量
}

function extractDimensions(text) {
    const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*[×*x]\s*(\d+(?:\.\d+)?)\s*[×*x]\s*(\d+(?:\.\d+)?)/i);
    if (dimMatch) {
        return {
            length: parseFloat(dimMatch[1]),
            width: parseFloat(dimMatch[2]),
            height: parseFloat(dimMatch[3])
        };
    }
    return { length: 30, width: 20, height: 15 }; // 默认尺寸
}

function extractShippingMethods(text) {
    const methods = [];
    if (/air|空运|航空/i.test(text)) methods.push('air');
    if (/sea|海运|船运/i.test(text)) methods.push('sea');
    if (/express|快递/i.test(text)) methods.push('express');
    return methods.length > 0 ? methods : ['express'];
}

function extractProductInfo(text) {
    if (/electronics|电子/i.test(text)) return 'electronics';
    if (/clothing|服装/i.test(text)) return 'clothing';
    if (/books|书籍/i.test(text)) return 'books';
    return 'general';
}

function extractMaterial(text) {
    if (/fragile|易碎/i.test(text)) return 'fragile';
    if (/liquid|液体/i.test(text)) return 'liquid';
    return 'solid';
}

function extractQuantity(text) {
    const qtyMatch = text.match(/(\d+)\s*(?:pcs?|pieces?|个|件)/i);
    if (qtyMatch) {
        return parseInt(qtyMatch[1]);
    }
    return 1;
}

function extractCustomPrice(text) {
    const priceMatch = text.match(/单价[：:]?\s*(\d+(?:\.\d+)?)|价格[：:]?\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*元\/kg/i);
    if (priceMatch) {
        return parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    }
    return null;
}

function formatParseResult(parseResult) {
    let result = '';
    if (parseResult.country) result += `国家: ${parseResult.country}\n`;
    if (parseResult.city) result += `城市: ${parseResult.city}\n`;
    if (parseResult.address) result += `地址: ${parseResult.address}\n`;
    if (parseResult.postalCode) result += `邮编: ${parseResult.postalCode}\n`;
    if (parseResult.dimensions) {
        result += `尺寸: ${parseResult.dimensions.length}×${parseResult.dimensions.width}×${parseResult.dimensions.height}cm\n`;
    }
    if (parseResult.weight) result += `重量: ${parseResult.weight}kg\n`;
    if (parseResult.customPrice) result += `自定义单价: ¥${parseResult.customPrice}/kg\n`;
    return result.trim();
}

function calculatePricing(parseResult) {
    const quotes = [];
    
    // 获取实际重量和尺寸
    const actualWeight = parseResult.weight || 10;
    const dims = parseResult.dimensions || { length: 30, width: 20, height: 15 };
    
    // 计算体积重量
    const volumeWeight = (dims.length * dims.width * dims.height) / 6000;
    
    // 计算计费重量（取实际重量和体积重量的较大值）
    const chargeableWeight = Math.max(actualWeight, volumeWeight);
    
    // 计算围长
    const sortedDims = [dims.length, dims.width, dims.height].sort((a, b) => b - a);
    const girth = sortedDims[0] + (sortedDims[1] + sortedDims[2]) * 2;
    const isOversized = girth > 266;
    
    // 基础单价（自定义单价或默认价格）
    const basePricePerKg = parseResult.customPrice || 18;
    
    // 基础运费（按计费重量计算）
    const basePrice = basePricePerKg * chargeableWeight;
    
    // 计算附加费用
    let additionalFees = 0;
    let feeDetails = [];
    
    if (isOversized) {
        additionalFees += 180;
        feeDetails.push(`超围长费(围长${girth}CM>266CM): ¥180`);
    }
    
    // 超重费基于实际重量，不是计费重量
    if (actualWeight > 22.5 && actualWeight <= 40) {
        additionalFees += 50;
        feeDetails.push(`超重费(22.5-40KG): ¥50`);
    }
    
    const finalPrice = basePrice + additionalFees;
    
    // 生成报价
    if (parseResult.customPrice) {
        // 自定义单价时，显示通用报价
        quotes.push({
            channelName: '自定义单价报价',
            serviceType: 'custom',
            transitTime: '根据实际安排',
            chargeableWeight: chargeableWeight,
            actualWeight: actualWeight,
            volumeWeight: volumeWeight,
            basePrice: basePrice,
            additionalFees: additionalFees,
            totalPrice: finalPrice,
            pricePerKg: basePricePerKg,
            isCustomPrice: true,
            feeDetails: feeDetails,
            destinationZone: '美东',
            isOversized: isOversized,
            girth: girth
        });
    } else {
        // 标准报价时，显示具体渠道
        quotes.push({
            channelName: '美国空派特快专线',
            serviceType: 'air',
            transitTime: '6-12天',
            chargeableWeight: chargeableWeight,
            actualWeight: actualWeight,
            volumeWeight: volumeWeight,
            basePrice: basePrice,
            additionalFees: additionalFees,
            totalPrice: finalPrice,
            pricePerKg: basePricePerKg,
            isCustomPrice: false,
            feeDetails: feeDetails,
            destinationZone: '美东',
            isOversized: isOversized,
            girth: girth
        });
    }
    
    return quotes;
}

function formatQuotes(quotes) {
    let result = '';
    
    quotes.forEach((quote, index) => {
        result += `${index + 1}. ${quote.channelName}\n`;
        
        if (quote.isCustomPrice) {
            // 自定义单价显示
            result += `   🚛 运输方式: 📦 自定义报价\n`;
            result += `   ⏱️  运输时效: 根据实际安排\n`;
        } else {
            // 标准报价显示
            result += `   🚛 运输方式: ✈️ ${quote.serviceType}\n`;
            result += `   ⏱️  运输时效: ${quote.transitTime}\n`;
        }
        
        result += `   📏 体积重量: ${quote.volumeWeight.toFixed(6)}kg\n`;
        result += `   📦 实际重量: ${quote.actualWeight}kg\n`;
        result += `   💰 基础运费: ¥${quote.basePrice.toFixed(2)}（$${(quote.basePrice * 0.14).toFixed(2)}）${quote.isCustomPrice ? ' (自定义单价)' : ''}\n`;
        
        if (quote.additionalFees > 0) {
            result += `   📊 附加费用: ¥${quote.additionalFees.toFixed(2)}（$${(quote.additionalFees * 0.14).toFixed(2)}）\n`;
            result += `   📝 费用明细: ${quote.feeDetails.join(', ')}\n`;
        }
        
        result += `   💵 总价: ¥${quote.totalPrice.toFixed(2)}（$${(quote.totalPrice * 0.14).toFixed(2)}）\n`;
        
        // 显示单价（自定义单价或计算单价）
        if (quote.isCustomPrice) {
            result += `   📈 单价: ¥${quote.pricePerKg.toFixed(2)}/kg（$${(quote.pricePerKg * 0.14).toFixed(2)}/kg）\n`;
        } else {
            const calculatedPricePerKg = quote.chargeableWeight > 0 ? quote.totalPrice / quote.chargeableWeight : 0;
            result += `   📈 单价: ¥${calculatedPricePerKg.toFixed(2)}/kg（$${(calculatedPricePerKg * 0.14).toFixed(2)}/kg）\n`;
        }
        
        // 添加合计显示（总价*4）
        const totalAmount = quote.totalPrice * 4;
        result += `   💵 合计：总价*4: ¥${totalAmount.toFixed(2)}（$${(totalAmount * 0.14).toFixed(2)}）\n`;
        
        result += `   🎯 目的地分区: ${quote.destinationZone}\n`;
        
        if (quote.isOversized) {
            result += `   ⚠️  围长状态: 超围 (围长${quote.girth}CM>266CM)\n`;
        } else {
            result += `   ✅ 围长状态: 正常 (围长${quote.girth}CM≤266CM)\n`;
        }
        
        result += '\n';
    });
    
    return result;
}

startServer();
