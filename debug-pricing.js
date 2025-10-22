const { query, get } = require('./config/sqlite-database');

async function debugPricing() {
    try {
        console.log('=== 调试英国报价问题 ===\n');
        
        // 1. 检查英国渠道
        console.log('1. 英国渠道:');
        const channels = await query(`
            SELECT * FROM logistics_channels 
            WHERE destination_country = 'UK' AND is_active = 1
        `);
        console.log(channels);
        
        // 2. 检查起运港口
        console.log('\n2. 起运港口:');
        const ports = await query(`
            SELECT * FROM origin_ports 
            WHERE port_name LIKE '%深圳%' OR port_group LIKE '%深圳%'
        `);
        console.log(ports);
        
        // 3. 检查英国价格数据
        console.log('\n3. 英国价格数据:');
        const pricing = await query(`
            SELECT p.*, c.channel_name, o.port_name
            FROM pricing p
            JOIN logistics_channels c ON p.channel_id = c.id
            JOIN origin_ports o ON p.origin_port_id = o.id
            WHERE c.destination_country = 'UK'
            LIMIT 10
        `);
        console.log(pricing);
        
        // 4. 测试具体查询
        console.log('\n4. 测试25kg英国查询:');
        const testQuery = `
            SELECT p.*, c.channel_name
            FROM pricing p
            JOIN logistics_channels c ON p.channel_id = c.id
            WHERE c.destination_country = 'UK' 
            AND c.is_active = 1
            AND p.weight_min <= 25 
            AND (p.weight_max IS NULL OR p.weight_max >= 25)
        `;
        const testResult = await query(testQuery);
        console.log(testResult);
        
        // 5. 检查邮编分区
        console.log('\n5. 英国邮编分区:');
        const zones = await query(`
            SELECT * FROM postal_zones WHERE country = 'UK'
        `);
        console.log(zones);
        
    } catch (error) {
        console.error('调试失败:', error);
    }
}

debugPricing();
