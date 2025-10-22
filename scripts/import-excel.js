const XLSX = require('xlsx');
const { pool } = require('../config/database');
require('dotenv').config();

class ExcelImporter {
    constructor() {
        this.filePath = process.env.EXCEL_FILE_PATH;
        this.importedChannels = 0;
        this.importedPricing = 0;
        this.importedZones = 0;
        this.importedPorts = 0;
    }

    async importData() {
        try {
            console.log('开始导入Excel数据...');
            
            // 读取Excel文件
            const workbook = XLSX.readFile(this.filePath);
            const sheetNames = workbook.SheetNames;
            
            console.log(`发现 ${sheetNames.length} 个工作表`);
            
            // 清空现有数据
            await this.clearExistingData();
            
            // 导入基础数据
            await this.importBasicData();
            
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

    async clearExistingData() {
        console.log('清空现有数据...');
        
        await pool.execute('DELETE FROM pricing');
        await pool.execute('DELETE FROM special_rules');
        await pool.execute('DELETE FROM logistics_channels');
        await pool.execute('DELETE FROM postal_zones');
        await pool.execute('DELETE FROM origin_ports');
        
        // 重置自增ID
        await pool.execute('ALTER TABLE logistics_channels AUTO_INCREMENT = 1');
        await pool.execute('ALTER TABLE postal_zones AUTO_INCREMENT = 1');
        await pool.execute('ALTER TABLE origin_ports AUTO_INCREMENT = 1');
        await pool.execute('ALTER TABLE pricing AUTO_INCREMENT = 1');
        await pool.execute('ALTER TABLE special_rules AUTO_INCREMENT = 1');
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
            await pool.execute(
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
            await pool.execute(
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

        const query = `
            INSERT INTO logistics_channels 
            (channel_name, channel_type, destination_country, service_type, transit_time, description) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [
            channelInfo.channel_name,
            channelInfo.channel_type,
            channelInfo.destination_country,
            serviceType,
            channelInfo.transit_time,
            description
        ]);
        
        this.importedChannels++;
        return result.insertId;
    }

    async importPricingData(channelId, data, channelInfo) {
        // 查找价格数据行
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3) continue;
            
            // 检查是否为价格数据行（包含数字价格）
            const hasPrice = row.some(cell => {
                const num = parseFloat(cell);
                return !isNaN(num) && num > 0 && num < 1000; // 假设价格在0-1000之间
            });
            
            if (!hasPrice) continue;
            
            // 解析价格数据
            await this.parsePricingRow(channelId, row, channelInfo);
        }
    }

    async parsePricingRow(channelId, row, channelInfo) {
        try {
            // 获取默认起运港口
            const [portRows] = await pool.execute(
                'SELECT id FROM origin_ports WHERE region = ? LIMIT 1',
                [channelInfo.destination_country === 'USA' ? '华南' : '华东']
            );
            
            if (portRows.length === 0) return;
            
            const originPortId = portRows[0].id;
            
            // 解析目的地分区
            let destinationZone = 'default';
            const zoneText = String(row[2] || '').trim();
            if (zoneText.includes('美西')) {
                destinationZone = '8,9';
            } else if (zoneText.includes('美中')) {
                destinationZone = '4,5,6,7';
            } else if (zoneText.includes('美东')) {
                destinationZone = '0,1,2,3';
            }
            
            // 查找价格列
            for (let j = 3; j < row.length; j++) {
                const price = parseFloat(row[j]);
                if (isNaN(price) || price <= 0 || price > 1000) continue;
                
                // 根据列位置确定重量范围
                let weightMin = 21;
                let weightMax = null;
                
                if (j === 3 || j === 5 || j === 7) { // 21-100KG列
                    weightMin = 21;
                    weightMax = 100;
                } else if (j === 4 || j === 6 || j === 8) { // 100KG+列
                    weightMin = 100;
                    weightMax = null;
                }
                
                // 插入价格记录
                await pool.execute(`
                    INSERT INTO pricing 
                    (channel_id, origin_port_id, destination_zone, weight_min, weight_max, price_per_kg, effective_date) 
                    VALUES (?, ?, ?, ?, ?, ?, CURDATE())
                `, [channelId, originPortId, destinationZone, weightMin, weightMax, price]);
                
                this.importedPricing++;
            }
            
        } catch (error) {
            console.error('解析价格行失败:', error);
        }
    }

    async importSpecialRules(channelId, data, channelInfo) {
        // 查找特殊规则信息
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const text = String(row.join(' ')).toLowerCase();
            
            // 偏远费规则
            if (text.includes('偏远费') && text.includes('kg')) {
                const match = text.match(/偏远费[+＋](\d+(?:\.\d+)?)/);
                if (match) {
                    await pool.execute(`
                        INSERT INTO special_rules (channel_id, rule_type, rule_description, rule_value) 
                        VALUES (?, 'remote_fee', ?, ?)
                    `, [
                        channelId,
                        `偏远费+${match[1]}/kg`,
                        JSON.stringify({ rate: parseFloat(match[1]) })
                    ]);
                }
            }
            
            // 磁检费规则
            if (text.includes('磁检费')) {
                const match = text.match(/磁检费(\d+)/);
                if (match) {
                    await pool.execute(`
                        INSERT INTO special_rules (channel_id, rule_type, rule_description, rule_value) 
                        VALUES (?, 'surcharge', ?, ?)
                    `, [
                        channelId,
                        `磁检费${match[1]}元/件`,
                        JSON.stringify({ type: 'magnetic', fee: parseInt(match[1]) })
                    ]);
                }
            }
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const importer = new ExcelImporter();
    importer.importData()
        .then(() => {
            console.log('Excel数据导入完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Excel数据导入失败:', error);
            process.exit(1);
        });
}

module.exports = ExcelImporter;
