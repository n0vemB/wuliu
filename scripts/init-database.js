const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+08:00'
};

async function initDatabase() {
    let connection;
    
    try {
        // 连接到MySQL服务器（不指定数据库）
        connection = await mysql.createConnection(dbConfig);
        
        // 创建数据库
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`数据库 ${process.env.DB_NAME} 创建成功`);
        
        // 选择数据库
        await connection.execute(`USE ${process.env.DB_NAME}`);
        
        // 创建物流渠道表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS logistics_channels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                channel_name VARCHAR(100) NOT NULL COMMENT '渠道名称',
                channel_type ENUM('海运','空运','铁路','卡航','快递') NOT NULL COMMENT '渠道类型',
                destination_country VARCHAR(50) NOT NULL COMMENT '目的国家',
                service_type VARCHAR(100) COMMENT '服务类型',
                transit_time VARCHAR(50) COMMENT '运输时效',
                description TEXT COMMENT '渠道描述',
                is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_country (destination_country),
                INDEX idx_type (channel_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物流渠道表'
        `);
        
        // 创建地区邮编映射表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS postal_zones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country VARCHAR(50) NOT NULL COMMENT '国家',
                postal_code_prefix VARCHAR(10) COMMENT '邮编前缀',
                zone_code VARCHAR(10) NOT NULL COMMENT '分区代码',
                zone_name VARCHAR(50) NOT NULL COMMENT '分区名称',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_country_postal (country, postal_code_prefix),
                INDEX idx_zone (zone_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='地区邮编映射表'
        `);
        
        // 创建起运地表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS origin_ports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                port_group VARCHAR(100) NOT NULL COMMENT '港口组',
                port_code VARCHAR(20) NOT NULL COMMENT '港口代码',
                port_name VARCHAR(50) NOT NULL COMMENT '港口名称',
                region VARCHAR(50) COMMENT '地区',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_region (region),
                INDEX idx_code (port_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='起运地表'
        `);
        
        // 创建价格表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pricing (
                id INT AUTO_INCREMENT PRIMARY KEY,
                channel_id INT NOT NULL COMMENT '渠道ID',
                origin_port_id INT NOT NULL COMMENT '起运地ID',
                destination_zone VARCHAR(10) NOT NULL COMMENT '目的地分区',
                weight_min DECIMAL(10,2) NOT NULL COMMENT '最小重量',
                weight_max DECIMAL(10,2) COMMENT '最大重量',
                price_per_kg DECIMAL(10,2) NOT NULL COMMENT '每公斤价格',
                additional_fees JSON COMMENT '附加费用',
                effective_date DATE NOT NULL COMMENT '生效日期',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES logistics_channels(id) ON DELETE CASCADE,
                FOREIGN KEY (origin_port_id) REFERENCES origin_ports(id) ON DELETE CASCADE,
                INDEX idx_channel_zone (channel_id, destination_zone),
                INDEX idx_weight (weight_min, weight_max)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='价格表'
        `);
        
        // 创建特殊规则表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS special_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                channel_id INT NOT NULL COMMENT '渠道ID',
                rule_type ENUM('size_limit','weight_limit','prohibited_items','surcharge','remote_fee') NOT NULL COMMENT '规则类型',
                rule_description TEXT NOT NULL COMMENT '规则描述',
                rule_value JSON COMMENT '规则值',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES logistics_channels(id) ON DELETE CASCADE,
                INDEX idx_channel_type (channel_id, rule_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特殊规则表'
        `);
        
        console.log('所有数据表创建成功');
        
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('数据库初始化完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('数据库初始化失败:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase };
