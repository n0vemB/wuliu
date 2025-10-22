const fs = require('fs');
const path = require('path');

class AddressService {
    constructor() {
        this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.hereApiKey = process.env.HERE_API_KEY;
        this.mapboxApiKey = process.env.MAPBOX_API_KEY;
        
        // 本地地址数据库
        this.localDatabase = null;
        this.postalCodeDatabase = null;
        
        this.loadLocalDatabase();
    }

    /**
     * 加载本地地址数据库
     */
    async loadLocalDatabase() {
        try {
            // 加载邮编数据库
            this.postalCodeDatabase = {
                'US': {
                    pattern: /^\d{5}(-\d{4})?$/,
                    zones: {
                        '0': { name: '美东', states: ['CT', 'MA', 'ME', 'NH', 'NJ', 'NY', 'PR', 'RI', 'VT', 'VI'] },
                        '1': { name: '美东', states: ['DE', 'NY', 'PA'] },
                        '2': { name: '美东', states: ['DC', 'MD', 'NC', 'SC', 'VA', 'WV'] },
                        '3': { name: '美东', states: ['AL', 'FL', 'GA', 'MS', 'TN'] },
                        '4': { name: '美中', states: ['IN', 'KY', 'MI', 'OH'] },
                        '5': { name: '美中', states: ['IA', 'MN', 'MT', 'ND', 'SD', 'WI'] },
                        '6': { name: '美中', states: ['IL', 'KS', 'MO', 'NE'] },
                        '7': { name: '美中', states: ['AR', 'LA', 'OK', 'TX'] },
                        '8': { name: '美西', states: ['AZ', 'CO', 'ID', 'NM', 'NV', 'UT', 'WY'] },
                        '9': { name: '美西', states: ['AK', 'AS', 'CA', 'GU', 'HI', 'MH', 'FM', 'MP', 'OR', 'PW', 'WA'] }
                    },
                    remoteZips: [
                        // 阿拉斯加
                        /^99[0-9]{3}$/,
                        // 夏威夷
                        /^96[7-9][0-9]{2}$/,
                        // 其他偏远地区
                        /^00[0-9]{3}$/, // 军事基地
                        /^09[0-9]{3}$/, // 军事基地
                    ]
                },
                'UK': {
                    pattern: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/,
                    zones: { 'default': { name: '全境' } },
                    remoteAreas: [
                        // 苏格兰高地和岛屿
                        /^(IV|KW|PA|PH|AB|DD|FK|G|ML|EH|TD|DG|KA)/,
                        // 北爱尔兰
                        /^BT/,
                        // 威尔士偏远地区
                        /^(LL|SY|LD|NP|CF|SA)/,
                        // 英格兰偏远地区
                        /^(TR|PL|EX|TQ|TN|CT|ME|DA|BR|CR|SM|KT|RH|GU|PO|SO|SP|SN|BA|BS|GL|HR|WR|DY|WV|WS|B|CV|LE|NG|DE|S|DN|HU|LN|PE|CB|IP|NR|CO|CM|SS|RM|IG|UB|HA|TW|SW|SE|E|EC|WC|W|NW|N)/
                    ]
                },
                'CA': {
                    pattern: /^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/,
                    zones: { 'default': { name: '全境' } },
                    remoteAreas: [
                        // 北部地区
                        /^(X|Y)/,
                        // 偏远省份邮编
                        /^(A0|B0|C0|E0|G0|H0|J0|K0|L0|M0|N0|P0|R0|S0|T0|V0)/
                    ]
                },
                'AU': {
                    pattern: /^\d{4}$/,
                    zones: { 'default': { name: '全境' } },
                    remoteAreas: [
                        // 北领地
                        /^08[0-9]{2}$/,
                        // 西澳偏远地区
                        /^6[4-7][0-9]{2}$/,
                        // 昆士兰偏远地区
                        /^4[7-9][0-9]{2}$/,
                        // 南澳偏远地区
                        /^5[6-7][0-9]{2}$/,
                        // 塔斯马尼亚
                        /^7[0-9]{3}$/
                    ]
                }
            };

            // 加载城市数据库
            this.localDatabase = {
                majorCities: {
                    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
                    'UK': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'],
                    'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
                    'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
                    'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
                    'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
                    'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
                    'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
                    'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen']
                }
            };

            console.log('✅ 本地地址数据库加载完成');
        } catch (error) {
            console.error('加载本地地址数据库失败:', error);
        }
    }

    /**
     * 验证和标准化地址
     */
    async validateAddress(address, country, postalCode, city) {
        const result = {
            isValid: false,
            standardizedAddress: address,
            isRemote: false,
            confidence: 0.5,
            suggestions: [],
            provider: 'local'
        };

        try {
            // 1. 首先使用本地数据库验证
            const localResult = await this.validateWithLocalDatabase(address, country, postalCode, city);
            Object.assign(result, localResult);

            // 2. 如果有API密钥，使用外部服务验证
            if (this.googleApiKey && result.confidence < 0.8) {
                const googleResult = await this.validateWithGoogle(address, country, postalCode, city);
                if (googleResult.confidence > result.confidence) {
                    Object.assign(result, googleResult);
                    result.provider = 'google';
                }
            }

            if (this.hereApiKey && result.confidence < 0.8) {
                const hereResult = await this.validateWithHere(address, country, postalCode, city);
                if (hereResult.confidence > result.confidence) {
                    Object.assign(result, hereResult);
                    result.provider = 'here';
                }
            }

            return result;
        } catch (error) {
            console.error('地址验证失败:', error);
            return result;
        }
    }

    /**
     * 使用本地数据库验证
     */
    async validateWithLocalDatabase(address, country, postalCode, city) {
        const result = {
            isValid: true,
            standardizedAddress: address,
            isRemote: false,
            confidence: 0.6,
            suggestions: []
        };

        if (!country) {
            result.isValid = false;
            result.confidence = 0.1;
            return result;
        }

        const countryCode = this.getCountryCode(country);
        const postalInfo = this.postalCodeDatabase[countryCode];

        if (postalInfo && postalCode) {
            // 验证邮编格式
            if (!postalInfo.pattern.test(postalCode)) {
                result.isValid = false;
                result.confidence = 0.3;
                result.suggestions.push(`邮编格式不正确，${countryCode}邮编格式应为: ${this.getPostalCodeExample(countryCode)}`);
                return result;
            }

            // 检查是否为偏远地区
            if (postalInfo.remoteAreas) {
                result.isRemote = postalInfo.remoteAreas.some(pattern => pattern.test(postalCode));
            }

            result.confidence = 0.8;
        }

        // 验证城市
        if (city && this.localDatabase.majorCities[countryCode]) {
            const cities = this.localDatabase.majorCities[countryCode];
            const cityMatch = cities.find(c => c.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(c.toLowerCase()));
            
            if (cityMatch) {
                result.confidence = Math.min(result.confidence + 0.1, 0.9);
                if (cityMatch !== city) {
                    result.suggestions.push(`建议城市名称: ${cityMatch}`);
                }
            }
        }

        return result;
    }

    /**
     * 使用Google Places API验证
     */
    async validateWithGoogle(address, country, postalCode, city) {
        if (!this.googleApiKey) {
            throw new Error('Google API密钥未配置');
        }

        const fullAddress = `${address}, ${city}, ${country} ${postalCode}`.trim();
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${this.googleApiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const result = data.results[0];
                return {
                    isValid: true,
                    standardizedAddress: result.formatted_address,
                    isRemote: this.isRemoteByComponents(result.address_components, country),
                    confidence: 0.9,
                    suggestions: [],
                    coordinates: result.geometry.location
                };
            }

            return {
                isValid: false,
                standardizedAddress: address,
                isRemote: false,
                confidence: 0.2,
                suggestions: ['Google无法验证此地址']
            };
        } catch (error) {
            console.error('Google地址验证失败:', error);
            throw error;
        }
    }

    /**
     * 使用HERE API验证
     */
    async validateWithHere(address, country, postalCode, city) {
        if (!this.hereApiKey) {
            throw new Error('HERE API密钥未配置');
        }

        const fullAddress = `${address}, ${city}, ${country} ${postalCode}`.trim();
        const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(fullAddress)}&apikey=${this.hereApiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const result = data.items[0];
                return {
                    isValid: true,
                    standardizedAddress: result.address.label,
                    isRemote: this.isRemoteByHereResult(result, country),
                    confidence: result.scoring.queryScore || 0.8,
                    suggestions: [],
                    coordinates: result.position
                };
            }

            return {
                isValid: false,
                standardizedAddress: address,
                isRemote: false,
                confidence: 0.2,
                suggestions: ['HERE无法验证此地址']
            };
        } catch (error) {
            console.error('HERE地址验证失败:', error);
            throw error;
        }
    }

    /**
     * 获取国家代码
     */
    getCountryCode(country) {
        const countryMap = {
            '美国': 'US', 'USA': 'US', 'United States': 'US', 'america': 'US',
            '英国': 'UK', 'UK': 'UK', 'United Kingdom': 'UK', 'britain': 'UK',
            '加拿大': 'CA', 'Canada': 'CA', 'canada': 'CA',
            '澳洲': 'AU', '澳大利亚': 'AU', 'Australia': 'AU', 'australia': 'AU',
            '德国': 'DE', 'Germany': 'DE', 'germany': 'DE',
            '法国': 'FR', 'France': 'FR', 'france': 'FR',
            '意大利': 'IT', 'Italy': 'IT', 'italy': 'IT',
            '西班牙': 'ES', 'Spain': 'ES', 'spain': 'ES',
            '荷兰': 'NL', 'Netherlands': 'NL', 'netherlands': 'NL'
        };

        return countryMap[country] || country.toUpperCase();
    }

    /**
     * 获取邮编格式示例
     */
    getPostalCodeExample(countryCode) {
        const examples = {
            'US': '12345 或 12345-6789',
            'UK': 'SW1A 1AA',
            'CA': 'K1A 0A6',
            'AU': '2000',
            'DE': '10115',
            'FR': '75001',
            'IT': '00118',
            'ES': '28001',
            'NL': '1012'
        };

        return examples[countryCode] || '请查询该国邮编格式';
    }

    /**
     * 根据地址组件判断是否为偏远地区
     */
    isRemoteByComponents(components, country) {
        // 这里可以根据具体的地址组件来判断
        // 例如：某些州、省份、地区被认为是偏远的
        return false; // 简化实现
    }

    /**
     * 根据HERE结果判断是否为偏远地区
     */
    isRemoteByHereResult(result, country) {
        // 根据HERE API返回的结果判断偏远地区
        return false; // 简化实现
    }

    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            localDatabaseLoaded: !!this.localDatabase,
            googleApiAvailable: !!this.googleApiKey,
            hereApiAvailable: !!this.hereApiKey,
            mapboxApiAvailable: !!this.mapboxApiKey,
            supportedCountries: this.postalCodeDatabase ? Object.keys(this.postalCodeDatabase) : []
        };
    }
}

module.exports = AddressService;
