const fs = require('fs');
const path = require('path');
const AddressService = require('./addressService');

class AIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY;
        this.provider = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'claude'
        this.excelData = null;
        this.addressService = new AddressService();

        // 加载Excel数据到内存
        this.loadExcelData();
    }

    /**
     * 加载Excel数据到内存中，供AI使用
     */
    async loadExcelData() {
        try {
            const XLSX = require('xlsx');
            const filePath = process.env.EXCEL_FILE_PATH || './修正星巢国际通全球报价表2025 年7月20生效直客.xlsx';
            
            if (fs.existsSync(filePath)) {
                const workbook = XLSX.readFile(filePath);
                this.excelData = {};
                
                // 将每个工作表转换为JSON格式
                workbook.SheetNames.forEach(sheetName => {
                    if (sheetName !== '主页导航') {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        this.excelData[sheetName] = jsonData;
                    }
                });
                
                console.log(`✅ 已加载 ${Object.keys(this.excelData).length} 个Excel工作表到AI服务`);
            }
        } catch (error) {
            console.error('加载Excel数据失败:', error);
        }
    }

    /**
     * 使用AI进行智能报价
     * @param {string} userInput - 用户输入
     * @returns {Promise<Object>} AI报价结果
     */
    async getAIQuote(userInput) {
        if (!this.apiKey) {
            throw new Error('AI API密钥未配置');
        }

        try {
            const prompt = this.buildPrompt(userInput);
            const response = await this.callAI(prompt);
            return this.parseAIResponse(response);
        } catch (error) {
            console.error('AI报价失败:', error);
            throw error;
        }
    }

    /**
     * 构建AI提示词
     */
    buildPrompt(userInput) {
        const excelSummary = this.getExcelSummary();
        
        return `你是一个专业的国际物流报价专家。请根据用户输入和以下物流渠道数据，提供准确的报价。

## 可用物流渠道数据摘要：
${excelSummary}

## 用户查询：
${userInput}

## 请按以下JSON格式返回报价结果：
{
  "parsed": {
    "country": "目的国家",
    "city": "城市",
    "address": "详细地址",
    "postalCode": "邮编",
    "dimensions": {"length": 0, "width": 0, "height": 0},
    "weight": 0,
    "productType": "产品类型",
    "material": "材质"
  },
  "quotes": [
    {
      "channelName": "渠道名称",
      "serviceType": "服务类型",
      "transitTime": "运输时效",
      "pricePerKg": 0,
      "totalPrice": 0,
      "chargeableWeight": 0,
      "features": ["特色服务"],
      "restrictions": ["限制条件"],
      "additionalFees": {
        "remoteFee": 0,
        "fuelSurcharge": 0,
        "description": "费用说明"
      }
    }
  ],
  "recommendations": "推荐建议",
  "notes": "重要提醒"
}

请确保：
1. 准确解析用户输入的所有信息
2. 根据目的地匹配合适的物流渠道
3. 计算体积重量（长×宽×高÷6000）和实重，取较大值作为计费重量
4. 提供详细的价格明细和服务特色
5. 给出专业的物流建议`;
    }

    /**
     * 获取Excel数据摘要
     */
    getExcelSummary() {
        if (!this.excelData) return '暂无数据';
        
        const summary = [];
        Object.keys(this.excelData).forEach(sheetName => {
            const data = this.excelData[sheetName];
            if (data && data.length > 0) {
                // 提取前几行作为示例
                const sampleRows = data.slice(0, 5).map(row => 
                    row.filter(cell => cell && cell.toString().trim()).join(' | ')
                ).filter(row => row.length > 0);
                
                summary.push(`### ${sheetName}\n${sampleRows.join('\n')}`);
            }
        });
        
        return summary.join('\n\n');
    }

    /**
     * 调用AI API
     */
    async callAI(prompt) {
        if (this.provider === 'openai') {
            return await this.callOpenAI(prompt);
        } else if (this.provider === 'claude') {
            return await this.callClaude(prompt);
        } else {
            throw new Error('不支持的AI提供商');
        }
    }

    /**
     * 调用OpenAI API
     */
    async callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的国际物流报价专家，精通各种物流渠道和价格计算。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * 调用Claude API
     */
    async callClaude(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API错误: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * 解析AI响应
     */
    parseAIResponse(response) {
        try {
            // 尝试提取JSON部分
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // 如果没有找到JSON，返回原始响应
            return {
                success: false,
                message: response,
                error: 'AI响应格式不正确'
            };
        } catch (error) {
            return {
                success: false,
                message: response,
                error: '解析AI响应失败'
            };
        }
    }

    /**
     * 地址标准化和验证
     */
    async validateAddress(address, country, postalCode, city) {
        try {
            // 使用专业的地址服务进行验证
            const result = await this.addressService.validateAddress(address, country, postalCode, city);

            // 如果地址服务置信度较低，且有AI API，则使用AI增强验证
            if (result.confidence < 0.7 && this.apiKey) {
                const aiResult = await this.validateAddressWithAI(address, country, postalCode, city);

                // 合并结果，取置信度更高的
                if (aiResult.confidence > result.confidence) {
                    return {
                        ...aiResult,
                        provider: `${result.provider}+ai`,
                        fallbackUsed: true
                    };
                }
            }

            return result;
        } catch (error) {
            console.error('地址验证失败:', error);
            return {
                isValid: true, // 默认认为有效
                standardizedAddress: address,
                isRemote: false,
                confidence: 0.5,
                provider: 'fallback'
            };
        }
    }

    /**
     * 使用AI验证地址
     */
    async validateAddressWithAI(address, country, postalCode, city) {
        const prompt = `请验证并标准化以下地址信息：

国家: ${country}
城市: ${city || '未提供'}
地址: ${address}
邮编: ${postalCode || '未提供'}

请返回标准化的地址格式，并指出是否为有效地址。如果是偏远地区，请标注。

返回JSON格式：
{
  "isValid": true/false,
  "standardizedAddress": "标准化地址",
  "isRemote": true/false,
  "suggestions": ["地址建议"],
  "confidence": 0.95
}`;

        try {
            const response = await this.callAI(prompt);
            const result = this.parseAIResponse(response);
            return result.success !== false ? result : {
                isValid: true,
                standardizedAddress: address,
                isRemote: false,
                confidence: 0.5
            };
        } catch (error) {
            return {
                isValid: true,
                standardizedAddress: address,
                isRemote: false,
                confidence: 0.5
            };
        }
    }

    /**
     * 加载全球地址数据库
     */
    async loadAddressDatabase() {
        // 这里可以加载全球邮编数据库
        // 可以使用开源数据如GeoNames, OpenAddresses等
        console.log('加载全球地址数据库...');
        
        // 示例：加载常用国家的邮编规则
        this.addressDatabase = {
            'US': {
                postalCodePattern: /^\d{5}(-\d{4})?$/,
                zones: {
                    '0': 'Northeast', '1': 'Northeast', '2': 'Northeast', '3': 'Northeast',
                    '4': 'Midwest', '5': 'Midwest', '6': 'Midwest', '7': 'Midwest',
                    '8': 'West', '9': 'West'
                }
            },
            'UK': {
                postalCodePattern: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/,
                zones: { 'default': 'UK' }
            },
            'CA': {
                postalCodePattern: /^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/,
                zones: { 'default': 'Canada' }
            }
        };
    }

    /**
     * 获取AI服务状态
     */
    getStatus() {
        const addressStatus = this.addressService.getStatus();
        return {
            provider: this.provider,
            hasApiKey: !!this.apiKey,
            excelDataLoaded: !!this.excelData,
            excelSheets: this.excelData ? Object.keys(this.excelData).length : 0,
            addressService: addressStatus
        };
    }
}

module.exports = AIService;
