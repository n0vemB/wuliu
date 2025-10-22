const natural = require('natural');

class TextParser {
    constructor() {
        // 国家名称映射
        this.countryMap = {
            '美国': 'USA',
            'usa': 'USA',
            'us': 'USA',
            'united states': 'USA',
            'america': 'USA',
            '加拿大': 'Canada',
            'canada': 'Canada',
            '英国': 'UK',
            'uk': 'UK',
            'united kingdom': 'UK',
            '澳洲': 'Australia',
            '澳大利亚': 'Australia',
            'australia': 'Australia',
            '新西兰': 'New Zealand',
            'new zealand': 'New Zealand',
            '德国': 'Germany',
            'germany': 'Germany',
            '法国': 'France',
            'france': 'France',
            '意大利': 'Italy',
            'italy': 'Italy',
            '西班牙': 'Spain',
            'spain': 'Spain',
            '荷兰': 'Netherlands',
            'netherlands': 'Netherlands',
            '比利时': 'Belgium',
            'belgium': 'Belgium',
            '瑞士': 'Switzerland',
            'switzerland': 'Switzerland',
            '挪威': 'Norway',
            'norway': 'Norway',
            '阿鲁巴': 'Aruba',
            'aruba': 'Aruba',
            '阿联酋': 'UAE',
            'uae': 'UAE',
            '迪拜': 'UAE',
            'dubai': 'UAE',
            '沙特': 'Saudi Arabia',
            'saudi arabia': 'Saudi Arabia',
            '日本': 'Japan',
            'japan': 'Japan',
            '韩国': 'South Korea',
            'south korea': 'South Korea',
            'korea': 'South Korea'
        };

        // 城市名称映射
        this.cityMap = {
            'oranjestad': 'Oranjestad',
            'mississauga': 'Mississauga',
            'toronto': 'Toronto',
            'vancouver': 'Vancouver',
            'montreal': 'Montreal',
            'calgary': 'Calgary',
            'ottawa': 'Ottawa',
            'portrush': 'Portrush',
            'belfast': 'Belfast',
            'london': 'London',
            'manchester': 'Manchester',
            'birmingham': 'Birmingham',
            'liverpool': 'Liverpool',
            'glasgow': 'Glasgow',
            'edinburgh': 'Edinburgh',
            'cardiff': 'Cardiff',
            'leeds': 'Leeds',
            'sheffield': 'Sheffield',
            'bristol': 'Bristol',
            'newcastle': 'Newcastle',
            'nottingham': 'Nottingham',
            'southampton': 'Southampton',
            'portsmouth': 'Portsmouth',
            'plymouth': 'Plymouth',
            'york': 'York',
            'bath': 'Bath',
            'oxford': 'Oxford',
            'cambridge': 'Cambridge'
        };

        // 物流方式关键词
        this.shippingMethods = {
            '联邦快递': 'FedEx',
            'fedex': 'FedEx',
            '联邦': 'FedEx',
            'ups': 'UPS',
            'dhl': 'DHL',
            '海派': 'Sea Shipping',
            '海运': 'Sea Shipping',
            '空派': 'Air Shipping',
            '空运': 'Air Shipping',
            '快递': 'Express',
            '铁路': 'Railway',
            '卡航': 'Truck'
        };
    }

    /**
     * 解析用户输入的文本
     * @param {string} text - 用户输入的文本
     * @returns {object} 解析结果
     */
    parseUserInput(text) {
        const result = {
            dimensions: null,
            weight: null,
            country: null,
            city: null,
            address: null,
            postalCode: null,
            shippingMethods: [],
            productInfo: null,
            material: null,
            quantity: null,
            customPrice: null, // 用户自定义单价
            isSuccess: false,
            errors: []
        };

        try {
            const normalizedText = text.toLowerCase().trim();
            
            // 解析尺寸 (支持多种格式: 25*25*18, 185CM*35CM*40CM, 25x25x18)
            result.dimensions = this.parseDimensions(text);
            
            // 解析重量
            result.weight = this.parseWeight(text);
            
            // 解析国家
            result.country = this.parseCountry(normalizedText);
            
            // 解析城市
            result.city = this.parseCity(text);
            
            // 解析地址
            result.address = this.parseAddress(text);
            
            // 解析邮编
            result.postalCode = this.parsePostalCode(text);
            
            // 解析物流方式
            result.shippingMethods = this.parseShippingMethods(normalizedText);
            
            // 解析产品信息
            result.productInfo = this.parseProductInfo(text);
            
            // 解析材质
            result.material = this.parseMaterial(text);
            
            // 解析数量
            result.quantity = this.parseQuantity(text);
            
            // 解析自定义单价
            result.customPrice = this.parseCustomPrice(text);
            
            // 检查解析是否成功
            result.isSuccess = this.validateResult(result);
            
            return result;
            
        } catch (error) {
            result.errors.push(`解析错误: ${error.message}`);
            return result;
        }
    }

    /**
     * 解析尺寸信息
     */
    parseDimensions(text) {
        // 匹配各种尺寸格式
        const patterns = [
            /(\d+(?:\.\d+)?)\s*[*×xX]\s*(\d+(?:\.\d+)?)\s*[*×xX]\s*(\d+(?:\.\d+)?)\s*(?:cm|CM)?/g,
            /尺寸[：:]\s*(\d+(?:\.\d+)?)\s*[*×xX]\s*(\d+(?:\.\d+)?)\s*[*×xX]\s*(\d+(?:\.\d+)?)\s*(?:cm|CM)?/g,
            /(\d+(?:\.\d+)?)\s*(?:cm|CM)\s*[*×xX]\s*(\d+(?:\.\d+)?)\s*(?:cm|CM)\s*[*×xX]\s*(\d+(?:\.\d+)?)\s*(?:cm|CM)/g
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                return {
                    length: parseFloat(match[1]),
                    width: parseFloat(match[2]),
                    height: parseFloat(match[3])
                };
            }
        }
        return null;
    }

    /**
     * 解析重量信息
     */
    parseWeight(text) {
        const patterns = [
            /(\d+(?:\.\d+)?)\s*kg/gi,
            /(\d+(?:\.\d+)?)\s*公斤/g,
            /重量[：:]\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤)?/gi
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return null;
    }

    /**
     * 解析国家信息
     */
    parseCountry(text) {
        // 首先尝试逗号分隔格式：US，Kansas，Topeka
        const parts = text.split(/[,，]/);
        if (parts.length >= 2) {
            const firstPart = parts[0].trim().toLowerCase();
            for (const [key, value] of Object.entries(this.countryMap)) {
                if (firstPart === key.toLowerCase()) {
                    return value;
                }
            }
        }

        // 然后尝试包含匹配
        for (const [key, value] of Object.entries(this.countryMap)) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        // 特殊处理 "Country" 关键词后的内容
        const countryMatch = text.match(/country\s+([a-zA-Z\s]+)/i);
        if (countryMatch) {
            const countryName = countryMatch[1].trim().toLowerCase();
            return this.countryMap[countryName] || countryName.toUpperCase();
        }

        return null;
    }

    /**
     * 解析城市信息
     */
    parseCity(text) {
        // 先检查已知城市映射
        for (const [key, value] of Object.entries(this.cityMap)) {
            if (text.toLowerCase().includes(key)) {
                return value;
            }
        }

        // 特殊处理 "City" 关键词后的内容
        const cityMatch = text.match(/city\s+([a-zA-Z\s]+)/i);
        if (cityMatch) {
            const cityName = cityMatch[1].trim();
            return this.cityMap[cityName.toLowerCase()] || cityName;
        }

        // 处理多行地址格式，查找包含州缩写的部分
        const lines = text.split(/\n/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 查找包含州缩写格式的行：Miami, FL 33166 或 Miami, FL
            const stateMatch = line.match(/^([A-Za-z\s]+),\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?$/);
            if (stateMatch) {
                const cityName = stateMatch[1].trim();
                if (cityName && cityName.length >= 2 && cityName.length <= 30) {
                    return cityName;
                }
            }
        }

        // 处理逗号分隔格式：US，Kansas，Topeka
        const parts = text.split(/[,，]/);
        if (parts.length >= 3) {
            // 第三部分通常是城市名
            const cityPart = parts[2].trim();
            if (cityPart && /^[A-Za-z\s]+$/.test(cityPart)) {
                return cityPart;
            }
        }

        // 尝试从地址中提取城市名（英文单词，通常在逗号分隔的第一部分）
        const addressParts = text.split(',');
        if (addressParts.length > 1) {
            // 查找可能的城市名（英文字母组成，长度3-20字符）
            for (let i = 0; i < Math.min(3, addressParts.length); i++) {
                const part = addressParts[i].trim();
                const cityPattern = /\b([A-Za-z]{3,20})\b/;
                const match = cityPattern.exec(part);
                if (match && !part.includes('Street') && !part.includes('Road') && !part.includes('Avenue')) {
                    const cityName = match[1];
                    // 排除一些常见的非城市词汇和公司名称
                    if (!['County', 'Main', 'High', 'First', 'Second', 'North', 'South', 'East', 'West', 
                          'Group', 'Company', 'Corp', 'Inc', 'LLC', 'Ltd', 'Logistics', 'Breton'].includes(cityName)) {
                        return cityName;
                    }
                }
            }
        }

        return null;
    }

    /**
     * 解析地址信息
     */
    parseAddress(text) {
        const addressMatch = text.match(/address\s+([^,\n]+)/i);
        if (addressMatch) {
            return addressMatch[1].trim();
        }

        // 处理多行地址格式，查找包含街道地址的行
        const lines = text.split(/\n|,|，/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 查找包含数字和街道关键词的行
            if (/\d+.*(?:street|st|avenue|ave|road|rd|circle|drive|dr|lane|ln|way|court|ct|place|pl|nw|ne|sw|se)/i.test(line)) {
                return line;
            }
            // 查找包含数字和字母组合的行（可能是地址）
            if (/\d+.*[A-Za-z]/.test(line) && line.length > 5 && line.length < 100) {
                // 排除邮编和国家
                if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/.test(line) && 
                    !/^\d{4,5}$/.test(line) && 
                    !/^(united states|usa|us)$/i.test(line)) {
                    return line;
                }
            }
        }

        // 匹配包含数字和字母的地址格式（更宽泛的匹配）
        const addressPatterns = [
            /(\d+(?:-\d+)?\s+[a-zA-Z\s]+(?:street|st|avenue|ave|road|rd|circle|drive|dr|lane|ln|way|court|ct|place|pl))/gi,
            /(\d+(?:-\d+)?\s+[A-Za-z\s]+Street)/gi, // 98-111 Main Street
            /(\d+\s+[A-Za-z\s]+(?:Street|Road|Avenue|Lane|Drive|Court|Place|Way))/gi
        ];

        for (const pattern of addressPatterns) {
            const match = pattern.exec(text);
            if (match) {
                return match[1].trim();
            }
        }

        // 如果没有找到标准地址格式，尝试从逗号分隔的部分中找到包含数字的地址
        const parts = text.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            // 查找包含数字和字母的部分，可能是地址
            if (/\d+.*[A-Za-z]/.test(trimmed) && trimmed.length > 5 && trimmed.length < 100) {
                // 排除邮编
                if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/.test(trimmed) && !/^\d{4,5}$/.test(trimmed)) {
                    return trimmed;
                }
            }
        }

        return null;
    }

    /**
     * 解析邮编信息
     */
    parsePostalCode(text) {
        const patterns = [
            /postal\s+code\s+([\w\s]+?)(?:[,\n]|$)/i,
            /邮编[：:]\s*([\w\s]+?)(?:[,\n]|$)/g,
            /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/g, // 英国邮编格式 BT56 8DA
            /\b([A-Z]\d[A-Z]\s*\d[A-Z]\d)\b/g, // 加拿大邮编格式
            /\b(\d{5}(?:-\d{4})?)\b/g, // 美国邮编格式
            /\b(\d{4,5})\b/g // 通用数字邮编
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                return match[1].replace(/\s+/g, ' ').trim();
            }
        }
        return null;
    }

    /**
     * 解析物流方式
     */
    parseShippingMethods(text) {
        const methods = [];
        for (const [key, value] of Object.entries(this.shippingMethods)) {
            if (text.includes(key)) {
                methods.push(value);
            }
        }
        return methods;
    }

    /**
     * 解析产品信息
     */
    parseProductInfo(text) {
        const productMatch = text.match(/产品[：:]\s*([^,\n材质]+)/);
        if (productMatch) {
            return productMatch[1].trim();
        }
        return null;
    }

    /**
     * 解析材质信息
     */
    parseMaterial(text) {
        const materialMatch = text.match(/材质[：:]\s*([^,\n产品]+)/);
        if (materialMatch) {
            return materialMatch[1].trim();
        }
        return null;
    }

    /**
     * 解析数量信息
     */
    parseQuantity(text) {
        const patterns = [
            /(\d+)\s*件/g,
            /数量[：:]\s*(\d+)/g,
            /-\s*(\d+)\s*件/g
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return null;
    }

    /**
     * 解析自定义单价
     */
    parseCustomPrice(text) {
        const patterns = [
            /单价[：:]\s*(\d+(?:\.\d+)?)\s*元/g,
            /价格[：:]\s*(\d+(?:\.\d+)?)\s*元/g,
            /(\d+(?:\.\d+)?)\s*元\/kg/g,
            /(\d+(?:\.\d+)?)\s*元\/公斤/g,
            /(\d+(?:\.\d+)?)\s*\/kg/g,
            /(\d+(?:\.\d+)?)\s*\/公斤/g,
            /单价\s*(\d+(?:\.\d+)?)/g,  // 匹配"单价18.1"格式
            /价格\s*(\d+(?:\.\d+)?)/g   // 匹配"价格18.1"格式
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return null;
    }

    /**
     * 智能推断重量（基于尺寸和产品类型）
     */
    inferWeight(dimensions, productInfo, material) {
        if (!dimensions) return null;

        const { length, width, height } = dimensions;
        const volume = (length * width * height) / 1000000; // 立方米

        // 根据产品类型和材质推断密度（kg/m³）
        let density = 100; // 默认密度

        if (productInfo) {
            const product = productInfo.toLowerCase();
            if (product.includes('窗帘') || product.includes('curtain')) {
                density = 50; // 窗帘类产品密度较低
            } else if (product.includes('家具') || product.includes('furniture')) {
                density = 200;
            } else if (product.includes('电子') || product.includes('electronic')) {
                density = 300;
            } else if (product.includes('服装') || product.includes('clothing')) {
                density = 80;
            } else if (product.includes('书籍') || product.includes('book')) {
                density = 600;
            }
        }

        if (material) {
            const mat = material.toLowerCase();
            if (mat.includes('铝') || mat.includes('aluminum')) {
                // 铝合金窗帘轨道通常是空心的，密度较低
                if (productInfo && productInfo.toLowerCase().includes('窗帘')) {
                    density = 80; // 空心铝合金窗帘轨道
                } else {
                    density = 150; // 实心铝合金
                }
            } else if (mat.includes('钢') || mat.includes('steel')) {
                density = 400;
            } else if (mat.includes('塑料') || mat.includes('plastic')) {
                density = 80;
            } else if (mat.includes('木') || mat.includes('wood')) {
                density = 120;
            } else if (mat.includes('纸') || mat.includes('paper')) {
                density = 200;
            }
        }

        const estimatedWeight = volume * density;

        // 合理范围检查（0.1kg - 1000kg）
        if (estimatedWeight >= 0.1 && estimatedWeight <= 1000) {
            return Math.round(estimatedWeight * 10) / 10; // 保留一位小数
        }

        return null;
    }

    /**
     * 验证解析结果
     */
    validateResult(result) {
        const hasBasicInfo = result.country || result.weight || result.dimensions;

        // 如果有尺寸但没有重量，尝试推断重量
        if (result.dimensions && !result.weight) {
            const inferredWeight = this.inferWeight(result.dimensions, result.productInfo, result.material);
            if (inferredWeight) {
                result.weight = inferredWeight;
                result.weightInferred = true; // 标记为推断重量
            }
        }

        return hasBasicInfo;
    }

    /**
     * 格式化解析结果为可读文本
     */
    formatResult(result) {
        const parts = [];
        
        if (result.dimensions) {
            const { length, width, height } = result.dimensions;
            parts.push(`尺寸: ${length}×${width}×${height}cm`);
            
            // 计算围长并判断是否超围
            const dimensionsArray = [length, width, height].sort((a, b) => b - a);
            const longest = dimensionsArray[0];
            const secondLongest = dimensionsArray[1];
            const shortest = dimensionsArray[2];
            const girth = longest + (secondLongest + shortest) * 2;
            
            const isOversized = girth > 266;
            const girthStatus = isOversized ? '超围' : '正常';
            parts.push(`围长: ${girth.toFixed(1)}cm (${girthStatus})`);
        }
        
        if (result.weight) {
            const weightText = result.weightInferred ?
                `重量: ${result.weight}kg (推断)` :
                `重量: ${result.weight}kg`;
            parts.push(weightText);
        }
        
        if (result.country) {
            parts.push(`国家: ${result.country}`);
        }
        
        if (result.city) {
            parts.push(`城市: ${result.city}`);
        }
        
        if (result.address) {
            parts.push(`地址: ${result.address}`);
        }
        
        if (result.postalCode) {
            parts.push(`邮编: ${result.postalCode}`);
        }
        
        if (result.shippingMethods.length > 0) {
            parts.push(`物流方式: ${result.shippingMethods.join(', ')}`);
        }
        
        if (result.productInfo) {
            parts.push(`产品: ${result.productInfo}`);
        }
        
        if (result.material) {
            parts.push(`材质: ${result.material}`);
        }
        
        if (result.quantity) {
            parts.push(`数量: ${result.quantity}件`);
        }
        
        if (result.customPrice) {
            parts.push(`自定义单价: ¥${result.customPrice}/kg`);
        }
        
        return parts.join('\n');
    }
}

module.exports = TextParser;
