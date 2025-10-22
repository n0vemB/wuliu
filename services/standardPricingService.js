const { query, get } = require('../config/sqlite-database');

class StandardPricingService {
    constructor() {
        this.volumeWeightDivisor = 6000; // 体积重量除数
        this.standardRates = this.initializeStandardRates();
        this.additionalFees = this.initializeAdditionalFees();
    }

    /**
     * 初始化标准化价格表
     */
    initializeStandardRates() {
        return {
            // 美国海运
            'US_SEA_MATSON_EXPRESS': {
                name: '美森特快限时达(14天)',
                type: 'sea',
                transitTime: '14天',
                schedule: '周一截单周三开船',
                compensation: '开船后13-14天提取，第15天起赔偿1元/KG/天，最高2元/KG',
                rates: {
                    'east_8_9': { '21-100': 18.4, '100+': 15.9 },      // 浙江仓-美西
                    'east_4567': { '21-100': 19.9, '100+': 17.4 },    // 浙江仓-美中
                    'east_0123': { '21-100': 20.9, '100+': 18.4 },    // 浙江仓-美东
                    'south_8_9': { '21-100': 18.9, '100+': 16.4 },    // 华南-美西
                    'south_4567': { '21-100': 20.4, '100+': 17.9 },   // 华南-美中
                    'south_0123': { '21-100': 21.4, '100+': 18.9 },   // 华南-美东
                    'north_8_9': { '21-100': 18.9, '100+': 16.4 },    // 华北-美西
                    'north_4567': { '21-100': 20.4, '100+': 17.9 },   // 华北-美中
                    'north_0123': { '21-100': 21.4, '100+': 18.9 }    // 华北-美东
                }
            },
            'US_SEA_MEDIUM_SPEED': {
                name: '中速限时达(16天)',
                type: 'sea',
                transitTime: '16天',
                schedule: '周二截单周四开船',
                compensation: '开船后15-17天提取，第18天起赔偿0.5元/KG/天，最高1元/KG',
                rates: {
                    'east_8_9': { '21-100': 17.8, '100+': 15.3 },      // 浙江仓-美西
                    'east_4567': { '21-100': 19.3, '100+': 16.8 },     // 浙江仓-美中
                    'east_0123': { '21-100': 20.3, '100+': 17.8 },     // 浙江仓-美东
                    'south_8_9': { '21-100': 18.3, '100+': 15.8 },     // 华南-美西
                    'south_4567': { '21-100': 19.8, '100+': 17.3 },    // 华南-美中
                    'south_0123': { '21-100': 20.8, '100+': 18.3 },    // 华南-美东
                    'north_8_9': { '21-100': 18.3, '100+': 15.8 },    // 华北-美西
                    'north_4567': { '21-100': 19.8, '100+': 17.3 },   // 华北-美中
                    'north_0123': { '21-100': 20.8, '100+': 18.3 }     // 华北-美东
                }
            },
            'US_SEA_REGULAR': {
                name: '中美普船快运(22天)',
                type: 'sea',
                transitTime: '22天',
                schedule: '六截一开',
                timeframe: '开船后21-25天提取',
                rates: {
                    'east_8_9': { '21-100': 13.8, '100+': 11.3 },      // 浙江仓-美西
                    'east_4567': { '21-100': 15.1, '100+': 12.6 },     // 浙江仓-美中
                    'east_0123': { '21-100': 16.1, '100+': 13.6 },     // 浙江仓-美东
                    'south_8_9': { '21-100': 13.8, '100+': 11.3 },    // 华南-美西
                    'south_4567': { '21-100': 15.1, '100+': 12.6 },   // 华南-美中
                    'south_0123': { '21-100': 16.1, '100+': 13.6 },   // 华南-美东
                    'north_8_9': { '21-100': 13.8, '100+': 11.3 },    // 华北-美西
                    'north_4567': { '21-100': 15.1, '100+': 12.6 },   // 华北-美中
                    'north_0123': { '21-100': 16.1, '100+': 13.6 }    // 华北-美东
                }
            },
            'US_SEA_EAST_SPECIAL': {
                name: '美东特惠快递派(34天)',
                type: 'sea',
                transitTime: '34天',
                timeframe: '开船后34-38天提取',
                rates: {
                    'east_0123': { '21-100': 15.3, '100+': 12.8 },     // 浙江仓-美东
                    'south_0123': { '21-100': 15.3, '100+': 12.8 },    // 华南-美东
                    'north_0123': { '21-100': 15.8, '100+': 13.3 }     // 华北-美东
                }
            },
            // 美国空派
            'US_AIR_EXPRESS': {
                name: '美国空派特快专线',
                type: 'air',
                transitTime: '6-12天',
                timeframe: '放行后6-12天',
                rates: {
                    'east_0123': { '12-21': 55, '22-75': 54, '76-99': 53, '100+': 51 },  // 浙江仓-美东
                    'east_4567': { '12-21': 54, '22-75': 53, '76-99': 52, '100+': 50 },   // 浙江仓-美中
                    'east_8_9': { '12-21': 53, '22-75': 52, '76-99': 51, '100+': 49 },    // 浙江仓-美西
                    'south_0123': { '12-21': 56, '22-75': 55, '76-99': 54, '100+': 52 },  // 华南-美东
                    'south_4567': { '12-21': 55, '22-75': 54, '76-99': 53, '100+': 51 },  // 华南-美中
                    'south_8_9': { '12-21': 54, '22-75': 53, '76-99': 52, '100+': 50 }    // 华南-美西
                }
            },
            // 欧洲海运
            'EU_SEA': {
                name: '欧洲海运专线(UPS/DPD派送)',
                type: 'sea',
                transitTime: '40天',
                timeframe: '开船后40天左右提取',
                rates: {
                    'DE_PL': { '21-50': 14.3, '51-99': 12.3, '100-999': 11.3, '1000+': 11.3 },
                    'FR_NL_CZ': { '21-50': 15.8, '51-99': 13.8, '100-999': 12.8, '1000+': 12.8 },
                    'ES_IT_AT': { '21-50': 16.3, '51-99': 14.3, '100-999': 13.3, '1000+': 13.3 },
                    'FI_SE_RO': { '21-50': 17.8, '51-99': 15.8, '100-999': 14.8, '1000+': 14.8 }
                }
            },
            // 欧洲铁路
            'EU_RAIL': {
                name: '欧洲铁路专线',
                type: 'rail',
                transitTime: '25-30天',
                timeframe: '发车后25-30天',
                rates: {
                    'DE_PL': { '21-50': 16, '51-99': 14, '100-999': 13, '1000+': 13 },
                    'FR_NL_CZ': { '21-50': 18, '51-99': 15.5, '100-999': 14.5, '1000+': 14.5 },
                    'ES_IT_AT': { '21-50': 18, '51-99': 16, '100-999': 15, '1000+': 15 },
                    'FI_SE_RO': { '21-50': 19.5, '51-99': 17.5, '100-999': 16.5, '1000+': 16.5 }
                }
            },
            // 欧洲卡航
            'EU_TRUCK': {
                name: '欧洲卡航专线',
                type: 'truck',
                transitTime: '24-26天',
                timeframe: '发车后24-26天',
                rates: {
                    'DE_PL': { '21-50': 22.5, '51-99': 20.5, '100-999': 19, '1000+': 18.5 },
                    'FR_NL_CZ': { '21-50': 24.5, '51-99': 22.5, '100-999': 21, '1000+': 20.5 },
                    'ES_IT_AT': { '21-50': 25, '51-99': 23, '100-999': 21.5, '1000+': 21 },
                    'FI_SE_RO': { '21-50': 26.5, '51-99': 24.5, '100-999': 23, '1000+': 22.5 }
                }
            },
            // 墨西哥海运
            'MX_SEA': {
                name: '墨西哥海派渠道（双清包税到门）',
                type: 'sea',
                transitTime: '30-35天',
                timeframe: '开船后30-35天',
                rates: {
                    'A_CLASS_KG': { '10+': 24 },
                    'A_CLASS_CBM': { '1+': 3000 },
                    'B_CLASS_KG': { '10+': 27 },
                    'B_CLASS_CBM': { '1+': 3200 },
                    'M_CLASS_KG': { '10+': 27 }
                }
            },
            // 澳洲海运
            'AU_SEA': {
                name: '澳洲海运（双清含税DDP）',
                type: 'sea',
                transitTime: '20-25天',
                timeframe: '开船后20-25天',
                rates: {
                    'SYD_MEL_BRI': { '22': 10, '50': 9.5, '100': 8.5, '300': 8, '500': 7.8, '1000': 7.5 },
                    'PER': { '22': 14, '50': 13, '100': 12.5, '300': 12.5, '500': 12, '1000': 11.5 }
                }
            },
            // 澳洲空派
            'AU_AIR': {
                name: '澳洲空派（大陆飞DDP）',
                type: 'air',
                transitTime: '7-10天',
                timeframe: '入仓后7-10天',
                rates: {
                    'SYD_MEL': { '22': 38, '50': 37.5, '100': 37, '300': 36.5, '500': 36, '1000': 35.5 },
                    'PER': { '22': 49, '50': 48.5, '100': 48, '300': 47.5, '500': 47, '1000': 46.5 }
                }
            }
        };
    }

    /**
     * 初始化附加费标准
     */
    initializeAdditionalFees() {
        return {
            // 重量尺寸附加费
            overweight: {
                '22.5-40': 255, // 超重费：22.5KG≤单件重量<40KG
                '30-50': 100,   // 超重费：30KG≤计费重<50KG
                '50-80': 150    // 超重费：50KG≤计费重<80KG
            },
            oversize: {
                '120-240': 180,  // 超长费：120CM≤最大边<240CM
                '110-200': 100,  // 超长费：110CM≤最大边<200CM
                '200-300': 300,  // 超长费：200CM≤最大边<300CM
                'second_edge_75': 180, // 第二边≥75CM
                'girth_260_320': 180   // 超围长费：围长>266CM（最长边+(次长+短边)*2）
            },
            irregular: 180, // 异形包裹费
            remote: {
                base: 25,    // 偏远费：25元/件
                minimum: 171 // 最低171元/票
            },
            special: {
                'covid_supplies': 3,  // 防疫物资：+3元/KG
                'hand_sanitizer': 5,  // 洗手液：+5元/KG
                'textiles_shoes': 3,  // 纺织品、鞋子：+3元/KG
                'ebike': 40,          // 电动自行车：+40欧元/台
                'covid_masks': 6      // 防疫物资（口罩、防护服）：+6元/KG
            },
            customs: 350 // 报关费：350元/票
        };
    }

    /**
     * 标准化报价计算
     */
    async calculateStandardPricing(params) {
        try {
            const {
                country,
                city,
                postalCode,
                weight,
                dimensions,
                shippingMethods = [],
                originCity = '深圳',
                productType,
                material,
                customPrice
            } = params;

            // 计算计费重量
            const chargeableWeight = this.calculateChargeableWeight(weight, dimensions);
            
            // 获取目的地分区和起运地
            const destinationInfo = this.getDestinationInfo(country, postalCode, city);
            const originInfo = this.getOriginInfo(originCity);
            
            // 如果有自定义单价，只返回一个通用报价
            if (customPrice) {
                const quote = this.calculateCustomPriceQuote(
                    originInfo,
                    destinationInfo,
                    chargeableWeight,
                    dimensions,
                    params
                );
                return quote ? [quote] : [];
            }
            
            // 获取可用的标准化渠道
            const availableChannels = this.getStandardChannels(country, shippingMethods, chargeableWeight);
            
            // 计算各渠道价格
            const quotes = [];
            for (const channelKey of availableChannels) {
                const quote = this.calculateChannelPrice(
                    channelKey,
                    originInfo,
                    destinationInfo,
                    chargeableWeight,
                    dimensions,
                    { ...params, customPrice }
                );
                
                if (quote) {
                    quotes.push(quote);
                }
            }
            
            // 按价格排序
            return quotes.sort((a, b) => a.totalPrice - b.totalPrice);
            
        } catch (error) {
            console.error('标准化报价计算失败:', error);
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

        return Math.max(chargeableWeight, 0.1);
    }

    /**
     * 获取目的地信息
     */
    getDestinationInfo(country, postalCode, city) {
        const info = {
            country: country,
            zone: 'default',
            region: 'default',
            isRemote: false
        };

        if (country === 'USA' || country === 'US') {
            if (postalCode) {
                const firstDigit = postalCode.charAt(0);
                if (['0', '1', '2', '3'].includes(firstDigit)) {
                    info.zone = '0123';
                    info.region = '美东';
                } else if (['4', '5', '6', '7'].includes(firstDigit)) {
                    info.zone = '4567';
                    info.region = '美中';
                } else if (['8', '9'].includes(firstDigit)) {
                    info.zone = '8_9';
                    info.region = '美西';
                }
            } else {
                // 如果没有邮编，默认为美西
                info.zone = '8_9';
                info.region = '美西';
            }
        } else if (country === 'Mexico' || country === 'MX') {
            info.zone = 'MX';
        } else if (['Germany', 'Poland', 'DE', 'PL'].includes(country)) {
            info.zone = 'DE_PL';
        } else if (['France', 'Netherlands', 'Czech', 'FR', 'NL', 'CZ'].includes(country)) {
            info.zone = 'FR_NL_CZ';
        } else if (['Spain', 'Italy', 'Austria', 'ES', 'IT', 'AT'].includes(country)) {
            info.zone = 'ES_IT_AT';
        } else if (['Finland', 'Sweden', 'Romania', 'FI', 'SE', 'RO'].includes(country)) {
            info.zone = 'FI_SE_RO';
        } else if (country === 'Australia' || country === 'AU') {
            if (city && ['Perth', 'PER'].includes(city)) {
                info.zone = 'PER';
            } else {
                info.zone = 'SYD_MEL_BRI';
            }
        }

        return info;
    }

    /**
     * 获取起运地信息
     */
    getOriginInfo(cityName) {
        const eastCities = ['义乌', '宁波', '杭州', '台州', '上海', '华东', '浙江'];
        const southCities = ['深圳', '广州', '中山', '东莞', '华南'];
        const northCities = ['泉州', '青岛'];

        if (eastCities.some(city => cityName.includes(city))) {
            return { region: 'east', code: 'east' };
        } else if (southCities.some(city => cityName.includes(city))) {
            return { region: 'south', code: 'south' };
        } else if (northCities.some(city => cityName.includes(city))) {
            return { region: 'north', code: 'north' };
        }

        return { region: 'east', code: 'east' }; // 默认浙江仓（华东）
    }

    /**
     * 获取标准化渠道
     */
    getStandardChannels(country, shippingMethods, weight) {
        const channels = [];

        if (country === 'USA' || country === 'US') {
            // 美国空派：12-21kg, 22-75kg, 76-99kg, 100kg+
            if (weight >= 12) {
                channels.push('US_AIR_EXPRESS');
            }
            // 美国海运：21-100kg, 100kg+
            if (weight >= 21) {
                channels.push('US_SEA_MATSON_EXPRESS', 'US_SEA_MEDIUM_SPEED', 'US_SEA_REGULAR', 'US_SEA_EAST_SPECIAL');
            }
        } else if (['Germany', 'France', 'Spain', 'Italy', 'Poland', 'Netherlands', 'DE', 'FR', 'ES', 'IT', 'PL', 'NL'].includes(country)) {
            if (weight >= 21) {
                channels.push('EU_SEA', 'EU_RAIL', 'EU_TRUCK');
            }
        } else if (country === 'Mexico' || country === 'MX') {
            if (weight >= 10) {
                channels.push('MX_SEA');
            }
        } else if (country === 'Australia' || country === 'AU') {
            if (weight >= 22) {
                channels.push('AU_SEA', 'AU_AIR');
            }
        }

        // 根据指定的物流方式筛选
        if (shippingMethods.length > 0) {
            return channels.filter(channel => {
                const channelInfo = this.standardRates[channel];
                return shippingMethods.some(method => 
                    channelInfo.name.toLowerCase().includes(method.toLowerCase()) ||
                    channelInfo.type.toLowerCase().includes(method.toLowerCase())
                );
            });
        }

        return channels;
    }

    /**
     * 计算自定义单价报价
     */
    calculateCustomPriceQuote(originInfo, destinationInfo, weight, dimensions, params) {
        try {
            const customPrice = params.customPrice;
            const actualWeight = params.weight || 0;
            
            // 计算基础运费
            const basePrice = customPrice * weight;
            
            // 计算附加费用
            const additionalFees = this.calculateStandardAdditionalFees(actualWeight, dimensions, params, destinationInfo);
            
            const totalPrice = basePrice + additionalFees.total;
            
            return {
                channelKey: 'CUSTOM_PRICE',
                channelName: '自定义单价报价',
                channelType: 'custom',
                transitTime: '根据实际渠道确定',
                schedule: '根据实际渠道确定',
                timeframe: '根据实际渠道确定',
                compensation: null,
                basePrice: basePrice,
                pricePerKg: customPrice,
                additionalFees: additionalFees,
                totalPrice: totalPrice,
                chargeableWeight: weight,
                destinationZone: destinationInfo.region || destinationInfo.zone,
                isCustomPrice: true
            };
        } catch (error) {
            console.error('计算自定义单价报价失败:', error);
            return null;
        }
    }

    /**
     * 计算单个渠道价格
     */
    calculateChannelPrice(channelKey, originInfo, destinationInfo, weight, dimensions, params) {
        const channelData = this.standardRates[channelKey];
        if (!channelData) return null;

        try {
            let basePrice;
            let pricePerKg;
            
            // 检查是否有自定义单价
            if (params.customPrice) {
                // 使用用户提供的单价
                pricePerKg = params.customPrice;
                basePrice = pricePerKg * weight;
            } else {
                // 从报价表获取价格
                basePrice = this.getChannelBasePrice(channelData, originInfo, destinationInfo, weight);
                if (!basePrice) return null;
                pricePerKg = basePrice / weight;
            }

            // 计算附加费用（使用实际重量判断超重费）
            const actualWeight = params.weight || 0;
            const additionalFees = this.calculateStandardAdditionalFees(actualWeight, dimensions, params, destinationInfo);
            
            const totalPrice = basePrice + additionalFees.total;

            return {
                channelKey: channelKey,
                channelName: channelData.name,
                channelType: channelData.type,
                transitTime: channelData.transitTime,
                schedule: channelData.schedule,
                timeframe: channelData.timeframe,
                compensation: channelData.compensation,
                basePrice: basePrice,
                pricePerKg: pricePerKg,
                additionalFees: additionalFees,
                totalPrice: totalPrice,
                chargeableWeight: weight,
                destinationZone: destinationInfo.region || destinationInfo.zone,
                isCustomPrice: !!params.customPrice
            };
        } catch (error) {
            console.error(`计算渠道 ${channelKey} 价格失败:`, error);
            return null;
        }
    }

    /**
     * 获取渠道基础价格
     */
    getChannelBasePrice(channelData, originInfo, destinationInfo, weight) {
        const rates = channelData.rates;
        
        // 构建查找键
        const lookupKeys = [
            `${originInfo.code}_${destinationInfo.zone}`,
            `all_${destinationInfo.zone}`,
            destinationInfo.zone,
            'default'
        ];

        for (const key of lookupKeys) {
            if (rates[key]) {
                const rateTable = rates[key];
                
                // 根据重量找到对应的价格
                for (const [weightRange, price] of Object.entries(rateTable)) {
                    if (this.isWeightInRange(weight, weightRange)) {
                        return price * weight;
                    }
                }
            }
        }

        return null;
    }

    /**
     * 判断重量是否在范围内
     */
    isWeightInRange(weight, range) {
        if (range === '21-100') {
            return weight >= 21 && weight <= 100;
        } else if (range === '100+') {
            return weight >= 100;
        } else if (range === '12-21') {
            return weight >= 12 && weight <= 21;
        } else if (range === '22-75') {
            return weight >= 22 && weight <= 75;
        } else if (range === '76-99') {
            return weight >= 76 && weight <= 99;
        } else if (range.includes('-')) {
            const [min, max] = range.split('-').map(Number);
            return weight >= min && weight <= max;
        } else if (range.includes('+')) {
            const min = Number(range.replace('+', ''));
            return weight >= min;
        } else {
            const exactWeight = Number(range);
            return weight >= exactWeight;
        }
    }

    /**
     * 计算标准化附加费用
     */
    calculateStandardAdditionalFees(weight, dimensions, params, destinationInfo) {
        const fees = {
            overweightFee: 0,
            oversizeFee: 0,
            irregularFee: 0,
            remoteFee: 0,
            specialFee: 0,
            customsFee: 0,
            total: 0,
            details: []
        };

        // 超重费
        if (weight >= 22.5 && weight < 40) {
            fees.overweightFee = this.additionalFees.overweight['22.5-40'];
            fees.details.push(`超重费(22.5-40KG): ¥${fees.overweightFee}`);
        } else if (weight >= 30 && weight < 50) {
            fees.overweightFee = this.additionalFees.overweight['30-50'];
            fees.details.push(`超重费(30-50KG): ¥${fees.overweightFee}`);
        } else if (weight >= 50 && weight < 80) {
            fees.overweightFee = this.additionalFees.overweight['50-80'];
            fees.details.push(`超重费(50-80KG): ¥${fees.overweightFee}`);
        }

        // 超长费
        if (dimensions) {
            const { length, width, height } = dimensions;
            const maxDimension = Math.max(length, width, height);
            
            // 计算围长：最长边+(次长+短边)*2
            const dimensionsArray = [length, width, height].sort((a, b) => b - a); // 降序排列
            const longest = dimensionsArray[0];
            const secondLongest = dimensionsArray[1];
            const shortest = dimensionsArray[2];
            const girth = longest + (secondLongest + shortest) * 2;
            
            if (maxDimension >= 120 && maxDimension < 240) {
                fees.oversizeFee += this.additionalFees.oversize['120-240'];
                fees.details.push(`超长费(120-240CM): ¥${this.additionalFees.oversize['120-240']}`);
            } else if (maxDimension >= 200 && maxDimension < 300) {
                fees.oversizeFee += this.additionalFees.oversize['200-300'];
                fees.details.push(`超长费(200-300CM): ¥${this.additionalFees.oversize['200-300']}`);
            }
            
            // 超围长费：围长 > 266cm 才算超围
            if (girth > 266) {
                fees.oversizeFee += this.additionalFees.oversize.girth_260_320;
                fees.details.push(`超围长费(围长${girth.toFixed(1)}CM>266CM): ¥${this.additionalFees.oversize.girth_260_320}`);
            }
        }

        // 偏远费
        if (destinationInfo.isRemote) {
            fees.remoteFee = Math.max(this.additionalFees.remote.base, this.additionalFees.remote.minimum);
            fees.details.push(`偏远费: ¥${fees.remoteFee}`);
        }

        // 特殊货物费
        if (params.productType) {
            const product = params.productType.toLowerCase();
            if (product.includes('防疫') || product.includes('口罩')) {
                fees.specialFee = this.additionalFees.special.covid_masks * weight;
                fees.details.push(`防疫物资费: ¥${fees.specialFee}`);
            } else if (product.includes('纺织') || product.includes('鞋')) {
                fees.specialFee = this.additionalFees.special.textiles_shoes * weight;
                fees.details.push(`纺织品费: ¥${fees.specialFee}`);
            }
        }

        fees.total = fees.overweightFee + fees.oversizeFee + fees.irregularFee + 
                     fees.remoteFee + fees.specialFee + fees.customsFee;

        return fees;
    }

    /**
     * 格式化标准化报价结果
     */
    formatStandardQuotes(quotes) {
        if (!quotes || quotes.length === 0) {
            return '抱歉，未找到合适的标准化物流渠道报价。';
        }

        let result = '📦 标准化物流报价结果：\n\n';
        
        quotes.forEach((quote, index) => {
            result += `${index + 1}. ${quote.channelName}\n`;
            result += `   🚛 运输方式: ${this.getTransportTypeIcon(quote.channelType)} ${quote.channelType}\n`;
            result += `   ⏱️  运输时效: ${quote.transitTime}\n`;
            if (quote.schedule) {
                result += `   📅 船期安排: ${quote.schedule}\n`;
            }
            if (quote.timeframe) {
                result += `   📋 提取时间: ${quote.timeframe}\n`;
            }
            result += `   ⚖️  计费重量: ${quote.chargeableWeight}kg\n`;
            
            // 基础运费（人民币+美元）
            const basePriceUSD = this.convertToUSD(quote.basePrice);
            const priceSource = quote.isCustomPrice ? ' (自定义单价)' : '';
            result += `   💰 基础运费: ¥${quote.basePrice.toFixed(2)}（$${basePriceUSD}）${priceSource}\n`;
            
            if (quote.additionalFees.total > 0) {
                const additionalFeesUSD = this.convertToUSD(quote.additionalFees.total);
                result += `   📊 附加费用: ¥${quote.additionalFees.total.toFixed(2)}（$${additionalFeesUSD}）\n`;
                if (quote.additionalFees.details.length > 0) {
                    result += `   📝 费用明细: ${quote.additionalFees.details.join(', ')}\n`;
                }
            }
            
            // 总价（人民币+美元）
            const totalPriceUSD = this.convertToUSD(quote.totalPrice);
            result += `   💵 总价: ¥${quote.totalPrice.toFixed(2)}（$${totalPriceUSD}）\n`;
            
            // 单价（人民币+美元）
            let unitPrice, unitPriceUSD;
            if (quote.isCustomPrice) {
                // 自定义单价显示用户输入的单价
                unitPrice = quote.pricePerKg;
                unitPriceUSD = this.convertToUSD(unitPrice);
                result += `   📈 单价: ¥${unitPrice.toFixed(2)}/kg（$${unitPriceUSD}/kg）\n`;
            } else {
                // 标准报价显示计算出的单价
                unitPrice = quote.totalPrice / quote.chargeableWeight;
                unitPriceUSD = this.convertToUSD(unitPrice);
                result += `   📈 单价: ¥${unitPrice.toFixed(2)}/kg（$${unitPriceUSD}/kg）\n`;
            }
            
            if (quote.destinationZone && quote.destinationZone !== 'default') {
                result += `   🎯 目的地分区: ${quote.destinationZone}\n`;
            }
            
            if (quote.compensation) {
                result += `   🛡️  延误理赔: ${quote.compensation}\n`;
            }
            
            result += '\n';
        });

        return result;
    }

    /**
     * 人民币转美元
     */
    convertToUSD(cnyAmount) {
        // 使用当前汇率 1 USD = 7.12 CNY (可根据实际情况调整)
        const exchangeRate = 7.12;
        const usdAmount = cnyAmount / exchangeRate;
        return usdAmount.toFixed(2);
    }

    /**
     * 获取运输方式图标
     */
    getTransportTypeIcon(type) {
        const icons = {
            'sea': '🚢',
            'air': '✈️',
            'rail': '🚂',
            'truck': '🚛',
            'express': '📦'
        };
        return icons[type] || '🚛';
    }
}

module.exports = StandardPricingService;
