const { query, get } = require('../config/sqlite-database');

class PricingService {
    constructor() {
        this.volumeWeightDivisor = 6000; // 体积重量除数
    }

    /**
     * 计算物流报价
     * @param {object} params - 查询参数
     * @returns {Promise<Array>} 报价结果
     */
    async calculatePricing(params) {
        try {
            const {
                country,
                city,
                postalCode,
                weight,
                dimensions,
                shippingMethods = [],
                originCity = '深圳'
            } = params;

            // 计算计费重量
            const chargeableWeight = this.calculateChargeableWeight(weight, dimensions);
            
            // 获取目的地分区
            const destinationZone = await this.getDestinationZone(country, postalCode);
            
            // 获取起运地信息
            const originPort = await this.getOriginPort(originCity);
            
            // 查询可用渠道
            const availableChannels = await this.getAvailableChannels(
                country, 
                shippingMethods,
                chargeableWeight
            );
            
            // 计算各渠道价格
            const quotes = [];
            for (const channel of availableChannels) {
                try {
                    const quote = await this.calculateChannelPrice(
                        channel,
                        originPort,
                        destinationZone,
                        chargeableWeight,
                        dimensions,
                        params
                    );
                    
                    if (quote) {
                        quotes.push(quote);
                    }
                } catch (error) {
                    console.error(`计算渠道 ${channel.channel_name} 价格失败:`, error);
                }
            }
            
            // 按价格排序
            return quotes.sort((a, b) => a.totalPrice - b.totalPrice);
            
        } catch (error) {
            console.error('计算报价失败:', error);
            throw new Error('报价计算失败');
        }
    }

    /**
     * 计算计费重量
     */
    calculateChargeableWeight(actualWeight, dimensions) {
        if (!actualWeight && !dimensions) {
            throw new Error('重量和尺寸信息不能同时为空');
        }

        let chargeableWeight = actualWeight || 0;

        if (dimensions) {
            const { length, width, height } = dimensions;
            const volumeWeight = (length * width * height) / this.volumeWeightDivisor;
            chargeableWeight = Math.max(chargeableWeight, volumeWeight);
        }

        return Math.max(chargeableWeight, 0.1); // 最小计费重量0.1kg
    }

    /**
     * 获取目的地分区
     */
    async getDestinationZone(country, postalCode) {
        if (!country) return null;

        try {
            let querySQL = `
                SELECT zone_code, zone_name
                FROM postal_zones
                WHERE country = ?
            `;
            let params = [country];

            if (postalCode) {
                // 根据邮编前缀匹配分区 (SQLite语法)
                querySQL += ` AND (postal_code_prefix IS NULL OR ? LIKE postal_code_prefix || '%')`;
                params.push(postalCode);
                querySQL += ` ORDER BY LENGTH(postal_code_prefix) DESC`;
            }

            querySQL += ` LIMIT 1`;

            const rows = await query(querySQL, params);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('获取目的地分区失败:', error);
            return null;
        }
    }

    /**
     * 获取起运地信息
     */
    async getOriginPort(cityName) {
        try {
            // 首先尝试精确匹配
            let querySQL = `
                SELECT * FROM origin_ports
                WHERE port_name LIKE ? OR port_group LIKE ?
                LIMIT 1
            `;
            let rows = await query(querySQL, [`%${cityName}%`, `%${cityName}%`]);

            if (rows.length > 0) {
                return rows[0];
            }

            // 如果没有找到，返回默认港口（华南地区优先）
            querySQL = `
                SELECT * FROM origin_ports
                WHERE region = '华南'
                LIMIT 1
            `;
            rows = await query(querySQL);

            if (rows.length > 0) {
                return rows[0];
            }

            // 如果还没有找到，返回任意港口
            querySQL = `SELECT * FROM origin_ports LIMIT 1`;
            rows = await query(querySQL);

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('获取起运地信息失败:', error);
            return null;
        }
    }

    /**
     * 获取可用渠道
     */
    async getAvailableChannels(country, shippingMethods, weight) {
        try {
            let querySQL = `
                SELECT * FROM logistics_channels
                WHERE destination_country = ? AND is_active = 1
            `;
            let params = [country];

            // 如果指定了物流方式，进行筛选
            if (shippingMethods.length > 0) {
                const methodConditions = shippingMethods.map(() => 'channel_name LIKE ? OR service_type LIKE ?').join(' OR ');
                querySQL += ` AND (${methodConditions})`;

                shippingMethods.forEach(method => {
                    params.push(`%${method}%`, `%${method}%`);
                });
            }

            const rows = await query(querySQL, params);
            return rows;
        } catch (error) {
            console.error('获取可用渠道失败:', error);
            return [];
        }
    }

    /**
     * 计算单个渠道价格
     */
    async calculateChannelPrice(channel, originPort, destinationZone, weight, dimensions, params) {
        try {
            // 获取基础价格
            const basePrice = await this.getBasePrice(channel.id, originPort?.id, destinationZone?.zone_code, weight);
            
            if (!basePrice) {
                return null;
            }

            // 计算附加费用
            const additionalFees = await this.calculateAdditionalFees(channel.id, weight, dimensions, params);
            
            const totalPrice = basePrice.price + additionalFees.total;

            return {
                channelId: channel.id,
                channelName: channel.channel_name,
                serviceType: channel.service_type,
                channelType: channel.channel_type,
                transitTime: channel.transit_time,
                basePrice: basePrice.price,
                pricePerKg: basePrice.price_per_kg,
                additionalFees: additionalFees,
                totalPrice: totalPrice,
                chargeableWeight: weight,
                description: channel.description,
                destinationZone: destinationZone?.zone_name
            };
        } catch (error) {
            console.error(`计算渠道 ${channel.channel_name} 价格失败:`, error);
            return null;
        }
    }

    /**
     * 获取基础价格
     */
    async getBasePrice(channelId, originPortId, zoneCode, weight) {
        try {
            // 首先尝试精确匹配（包括港口和分区）
            let querySQL = `
                SELECT price_per_kg, weight_min, weight_max
                FROM pricing
                WHERE channel_id = ?
                AND (weight_min <= ? AND (weight_max IS NULL OR weight_max >= ?))
            `;
            let params = [channelId, weight, weight];

            if (originPortId) {
                querySQL += ` AND origin_port_id = ?`;
                params.push(originPortId);
            }

            if (zoneCode) {
                querySQL += ` AND destination_zone = ?`;
                params.push(zoneCode);
            }

            querySQL += ` ORDER BY weight_min DESC LIMIT 1`;

            let rows = await query(querySQL, params);

            if (rows.length > 0) {
                const pricePerKg = rows[0].price_per_kg;
                return {
                    price_per_kg: pricePerKg,
                    price: pricePerKg * weight
                };
            }

            // 如果没有找到，尝试忽略港口限制
            if (originPortId) {
                querySQL = `
                    SELECT price_per_kg, weight_min, weight_max
                    FROM pricing
                    WHERE channel_id = ?
                    AND (weight_min <= ? AND (weight_max IS NULL OR weight_max >= ?))
                `;
                params = [channelId, weight, weight];

                if (zoneCode) {
                    querySQL += ` AND destination_zone = ?`;
                    params.push(zoneCode);
                }

                querySQL += ` ORDER BY weight_min DESC LIMIT 1`;

                rows = await query(querySQL, params);

                if (rows.length > 0) {
                    const pricePerKg = rows[0].price_per_kg;
                    return {
                        price_per_kg: pricePerKg,
                        price: pricePerKg * weight
                    };
                }
            }

            // 如果还没有找到，尝试忽略分区限制
            querySQL = `
                SELECT price_per_kg, weight_min, weight_max
                FROM pricing
                WHERE channel_id = ?
                AND (weight_min <= ? AND (weight_max IS NULL OR weight_max >= ?))
                ORDER BY weight_min DESC LIMIT 1
            `;
            params = [channelId, weight, weight];

            rows = await query(querySQL, params);

            if (rows.length > 0) {
                const pricePerKg = rows[0].price_per_kg;
                return {
                    price_per_kg: pricePerKg,
                    price: pricePerKg * weight
                };
            }

            return null;
        } catch (error) {
            console.error('获取基础价格失败:', error);
            return null;
        }
    }

    /**
     * 计算附加费用
     */
    async calculateAdditionalFees(channelId, weight, dimensions, params) {
        const fees = {
            remoteFee: 0,
            fuelSurcharge: 0,
            oversizeFee: 0,
            irregularFee: 0,
            magneticFee: 0,
            total: 0,
            details: []
        };

        try {
            // 获取渠道的特殊规则
            const querySQL = `
                SELECT rule_type, rule_description, rule_value
                FROM special_rules
                WHERE channel_id = ?
            `;
            const rules = await query(querySQL, [channelId]);

            for (const rule of rules) {
                const ruleValue = rule.rule_value ? JSON.parse(rule.rule_value) : {};
                
                switch (rule.rule_type) {
                    case 'remote_fee':
                        if (await this.isRemoteArea(params.postalCode)) {
                            fees.remoteFee = (ruleValue.rate || 1.5) * weight;
                            fees.details.push(`偏远费: ${fees.remoteFee}元`);
                        }
                        break;
                        
                    case 'surcharge':
                        if (ruleValue.type === 'fuel') {
                            fees.fuelSurcharge = (ruleValue.rate || 0.1) * weight;
                            fees.details.push(`燃油费: ${fees.fuelSurcharge}元`);
                        }
                        break;
                        
                    case 'size_limit':
                        if (dimensions && this.isOversize(dimensions, ruleValue)) {
                            fees.oversizeFee = ruleValue.fee || 100;
                            fees.details.push(`超大件费: ${fees.oversizeFee}元`);
                        }
                        break;
                }
            }

            fees.total = fees.remoteFee + fees.fuelSurcharge + fees.oversizeFee + fees.irregularFee + fees.magneticFee;
            
            return fees;
        } catch (error) {
            console.error('计算附加费用失败:', error);
            return fees;
        }
    }

    /**
     * 判断是否为偏远地区
     */
    async isRemoteArea(postalCode) {
        // 这里可以根据实际的偏远地区数据库进行判断
        // 暂时返回false，实际应用中需要维护偏远地区邮编数据
        return false;
    }

    /**
     * 判断是否超大件
     */
    isOversize(dimensions, limits) {
        if (!dimensions || !limits) return false;
        
        const { length, width, height } = dimensions;
        const maxDimension = Math.max(length, width, height);
        
        return maxDimension > (limits.max_dimension || 120) ||
               length > (limits.max_length || 200) ||
               width > (limits.max_width || 200) ||
               height > (limits.max_height || 200);
    }

    /**
     * 格式化报价结果
     */
    formatQuotes(quotes) {
        if (!quotes || quotes.length === 0) {
            return '抱歉，未找到合适的物流渠道报价。';
        }

        let result = '📦 物流报价结果：\n\n';
        
        quotes.forEach((quote, index) => {
            result += `${index + 1}. ${quote.channelName}\n`;
            result += `   服务类型: ${quote.serviceType || '标准服务'}\n`;
            result += `   运输方式: ${quote.channelType}\n`;
            result += `   运输时效: ${quote.transitTime || '待确认'}\n`;
            result += `   计费重量: ${quote.chargeableWeight}kg\n`;
            result += `   基础运费: ¥${quote.basePrice.toFixed(2)}\n`;
            
            if (quote.additionalFees.total > 0) {
                result += `   附加费用: ¥${quote.additionalFees.total.toFixed(2)}\n`;
                if (quote.additionalFees.details.length > 0) {
                    result += `   费用明细: ${quote.additionalFees.details.join(', ')}\n`;
                }
            }
            
            result += `   总价: ¥${quote.totalPrice.toFixed(2)}\n`;
            result += `   单价: ¥${(quote.totalPrice / quote.chargeableWeight).toFixed(2)}/kg\n`;
            
            if (quote.destinationZone) {
                result += `   目的地分区: ${quote.destinationZone}\n`;
            }
            
            result += '\n';
        });

        return result;
    }
}

module.exports = PricingService;
