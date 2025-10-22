const XLSX = require('xlsx');
const { run, query, initDatabase, clearAllData } = require('../config/sqlite-database');
require('dotenv').config();

class SQLiteImporter {
    constructor() {
        this.filePath = process.env.EXCEL_FILE_PATH || './修正星巢国际通全球报价表2025 年7月20生效直客.xlsx';
        this.importedChannels = 0;
        this.importedPricing = 0;
        this.importedZones = 0;
        this.importedPorts = 0;
    }

    async importData() {
        try {
            console.log('开始导入Excel数据到SQLite...');
            
            // 初始化数据库
            await initDatabase();
            
            // 清空现有数据
            await clearAllData();
            
            // 导入基础数据
            await this.importBasicData();
            
            // 读取Excel文件
            const workbook = XLSX.readFile(this.filePath);
            const sheetNames = workbook.SheetNames;
            
            console.log(`发现 ${sheetNames.length} 个工作表`);
            
            // 处理每个工作表
            for (const sheetName of sheetNames) {
                if (sheetName === '主页导航') continue; // 跳过导航页
                
                console.log(`处理工作表: ${sheetName}`);
                const worksheet = workbook.Sheets[sheetName];
                await this.processSheet(sheetName, worksheet);
            }
            
            console.log('\n导入完成统计:');
            console.log(`- 物流渠道: ${this.importedChannels}`);
            console.log(`- 价格记录: ${this.importedPricing}`);
            console.log(`- 地区分区: ${this.importedZones}`);
            console.log(`- 起运港口: ${this.importedPorts}`);
            
        } catch (error) {
            console.error('导入失败:', error);
            throw error;
        }
    }

    async importBasicData() {
        console.log('导入基础数据...');
        
        // 导入美国邮编分区
        const usZones = [
            { country: 'USA', postal_code_prefix: '0', zone_code: '0,1,2,3', zone_name: '美东' },
            { country: 'USA', postal_code_prefix: '1', zone_code: '0,1,2,3', zone_name: '美东' },
            { country: 'USA', postal_code_prefix: '2', zone_code: '0,1,2,3', zone_name: '美东' },
            { country: 'USA', postal_code_prefix: '3', zone_code: '0,1,2,3', zone_name: '美东' },
            { country: 'USA', postal_code_prefix: '4', zone_code: '4,5,6,7', zone_name: '美中' },
            { country: 'USA', postal_code_prefix: '5', zone_code: '4,5,6,7', zone_name: '美中' },
            { country: 'USA', postal_code_prefix: '6', zone_code: '4,5,6,7', zone_name: '美中' },
            { country: 'USA', postal_code_prefix: '7', zone_code: '4,5,6,7', zone_name: '美中' },
            { country: 'USA', postal_code_prefix: '8', zone_code: '8,9', zone_name: '美西' },
            { country: 'USA', postal_code_prefix: '9', zone_code: '8,9', zone_name: '美西' }
        ];

        for (const zone of usZones) {
            await run(
                'INSERT INTO postal_zones (country, postal_code_prefix, zone_code, zone_name) VALUES (?, ?, ?, ?)',
                [zone.country, zone.postal_code_prefix, zone.zone_code, zone.zone_name]
            );
            this.importedZones++;
        }

        // 导入加拿大邮编分区
        const canadaZones = [
            { country: 'Canada', postal_code_prefix: null, zone_code: 'default', zone_name: '全境' }
        ];

        for (const zone of canadaZones) {
            await run(
                'INSERT INTO postal_zones (country, postal_code_prefix, zone_code, zone_name) VALUES (?, ?, ?, ?)',
                [zone.country, zone.postal_code_prefix, zone.zone_code, zone.zone_name]
            );
            this.importedZones++;
        }

        // 导入起运港口
        const ports = [
            { port_group: '义乌/宁波/杭州/台州', port_code: 'YW', port_name: '义乌', region: '华东' },
            { port_group: '义乌/宁波/杭州/台州', port_code: 'NB', port_name: '宁波', region: '华东' },
            { port_group: '义乌/宁波/杭州/台州', port_code: 'HZ', port_name: '杭州', region: '华东' },
            { port_group: '义乌/宁波/杭州/台州', port_code: 'TZ', port_name: '台州', region: '华东' },
            { port_group: '深圳/广州/中山', port_code: 'SZ', port_name: '深圳', region: '华南' },
            { port_group: '深圳/广州/中山', port_code: 'GZ', port_name: '广州', region: '华南' },
            { port_group: '深圳/广州/中山', port_code: 'ZS', port_name: '中山', region: '华南' },
            { port_group: '泉州/青岛', port_code: 'QZ', port_name: '泉州', region: '华东' },
            { port_group: '泉州/青岛', port_code: 'QD', port_name: '青岛', region: '华东' },
            { port_group: '上海', port_code: 'SH', port_name: '上海', region: '华东' },
            { port_group: '东莞', port_code: 'DG', port_name: '东莞', region: '华南' }
        ];

        for (const port of ports) {
            await run(
                'INSERT INTO origin_ports (port_group, port_code, port_name, region) VALUES (?, ?, ?, ?)',
                [port.port_group, port.port_code, port.port_name, port.region]
            );
            this.importedPorts++;
        }
    }

    async processSheet(sheetName, worksheet) {
        try {
            // 解析工作表数据
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            // 根据工作表名称确定目的国家和渠道类型
            const channelInfo = this.parseChannelInfo(sheetName);
            
            // 创建渠道记录
            const channelId = await this.createChannel(channelInfo, data);
            
            // 解析并导入价格数据
            await this.importPricingData(channelId, data, channelInfo);
            
            // 导入特殊规则
            await this.importSpecialRules(channelId, data, channelInfo);
            
        } catch (error) {
            console.error(`处理工作表 ${sheetName} 失败:`, error);
        }
    }

    parseChannelInfo(sheetName) {
        const info = {
            channel_name: sheetName,
            destination_country: 'Unknown',
            channel_type: '海运',
            service_type: null,
            transit_time: null
        };

        // 解析国家
        if (sheetName.includes('美国')) {
            info.destination_country = 'USA';
        } else if (sheetName.includes('加拿大')) {
            info.destination_country = 'Canada';
        } else if (sheetName.includes('英国')) {
            info.destination_country = 'UK';
        } else if (sheetName.includes('欧洲')) {
            info.destination_country = 'Europe';
        } else if (sheetName.includes('澳洲')) {
            info.destination_country = 'Australia';
        } else if (sheetName.includes('新西兰')) {
            info.destination_country = 'New Zealand';
        } else if (sheetName.includes('墨西哥')) {
            info.destination_country = 'Mexico';
        } else if (sheetName.includes('阿联酋') || sheetName.includes('迪拜')) {
            info.destination_country = 'UAE';
        } else if (sheetName.includes('沙特')) {
            info.destination_country = 'Saudi Arabia';
        } else if (sheetName.includes('日韩')) {
            info.destination_country = 'Japan/Korea';
        } else if (sheetName.includes('瑞士')) {
            info.destination_country = 'Switzerland';
        } else if (sheetName.includes('挪威')) {
            info.destination_country = 'Norway';
        } else if (sheetName.includes('塞尔维亚')) {
            info.destination_country = 'Serbia';
        } else if (sheetName.includes('阿鲁巴')) {
            info.destination_country = 'Aruba';
        }

        // 解析渠道类型
        if (sheetName.includes('空派') || sheetName.includes('空运')) {
            info.channel_type = '空运';
        } else if (sheetName.includes('海运') || sheetName.includes('海派')) {
            info.channel_type = '海运';
        } else if (sheetName.includes('铁路')) {
            info.channel_type = '铁路';
        } else if (sheetName.includes('卡航')) {
            info.channel_type = '卡航';
        } else if (sheetName.includes('快递')) {
            info.channel_type = '快递';
        }

        // 解析时效
        const timeMatch = sheetName.match(/(\d+)天/);
        if (timeMatch) {
            info.transit_time = timeMatch[1] + '天';
        }

        return info;
    }

    async createChannel(channelInfo, data) {
        // 从数据中提取更详细的信息
        let description = '';
        let serviceType = channelInfo.service_type;
        
        // 查找描述信息
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row.length > 0) {
                const cellText = String(row[2] || '').trim();
                if (cellText.includes('特快') || cellText.includes('限时达')) {
                    serviceType = cellText;
                    break;
                }
            }
        }

        const result = await run(`
            INSERT INTO logistics_channels 
            (channel_name, channel_type, destination_country, service_type, transit_time, description) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            channelInfo.channel_name,
            channelInfo.channel_type,
            channelInfo.destination_country,
            serviceType,
            channelInfo.transit_time,
            description
        ]);
        
        this.importedChannels++;
        return result.lastID;
    }

    async importPricingData(channelId, data, channelInfo) {
        // 简化版价格导入 - 创建示例价格数据
        try {
            // 获取默认起运港口
            const portRows = await query(
                'SELECT id FROM origin_ports WHERE region = ? LIMIT 1',
                [channelInfo.destination_country === 'USA' ? '华南' : '华东']
            );
            
            if (portRows.length === 0) return;
            
            const originPortId = portRows[0].id;
            
            // 创建示例价格数据
            const samplePrices = [
                { zone: 'default', weightMin: 0.1, weightMax: 21, price: 35 },
                { zone: 'default', weightMin: 21, weightMax: 100, price: 28 },
                { zone: 'default', weightMin: 100, weightMax: null, price: 25 }
            ];

            // 如果是美国，创建分区价格
            if (channelInfo.destination_country === 'USA') {
                const zones = ['0,1,2,3', '4,5,6,7', '8,9'];
                for (const zone of zones) {
                    for (const priceData of samplePrices) {
                        await run(`
                            INSERT INTO pricing 
                            (channel_id, origin_port_id, destination_zone, weight_min, weight_max, price_per_kg, effective_date) 
                            VALUES (?, ?, ?, ?, ?, ?, date('now'))
                        `, [channelId, originPortId, zone, priceData.weightMin, priceData.weightMax, priceData.price]);
                        
                        this.importedPricing++;
                    }
                }
            } else {
                // 其他国家使用默认价格
                for (const priceData of samplePrices) {
                    await run(`
                        INSERT INTO pricing 
                        (channel_id, origin_port_id, destination_zone, weight_min, weight_max, price_per_kg, effective_date) 
                        VALUES (?, ?, ?, ?, ?, ?, date('now'))
                    `, [channelId, originPortId, 'default', priceData.weightMin, priceData.weightMax, priceData.price]);
                    
                    this.importedPricing++;
                }
            }
            
        } catch (error) {
            console.error('导入价格数据失败:', error);
        }
    }

    async importSpecialRules(channelId, data, channelInfo) {
        try {
            // 添加一些示例特殊规则
            if (channelInfo.channel_type === '空运') {
                // 偏远费规则
                await run(`
                    INSERT INTO special_rules (channel_id, rule_type, rule_description, rule_value) 
                    VALUES (?, 'remote_fee', ?, ?)
                `, [
                    channelId,
                    '偏远费+1.5/kg',
                    JSON.stringify({ rate: 1.5 })
                ]);
            }
            
            if (channelInfo.channel_name.includes('快递')) {
                // 磁检费规则
                await run(`
                    INSERT INTO special_rules (channel_id, rule_type, rule_description, rule_value) 
                    VALUES (?, 'surcharge', ?, ?)
                `, [
                    channelId,
                    '磁检费20元/件',
                    JSON.stringify({ type: 'magnetic', fee: 20 })
                ]);
            }
        } catch (error) {
            console.error('导入特殊规则失败:', error);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const importer = new SQLiteImporter();
    importer.importData()
        .then(() => {
            console.log('SQLite数据导入完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('SQLite数据导入失败:', error);
            process.exit(1);
        });
}

module.exports = SQLiteImporter;
