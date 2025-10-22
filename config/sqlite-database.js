const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'data', 'logistics.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('SQLite连接失败:', err.message);
    } else {
        console.log('SQLite数据库连接成功');
    }
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 测试数据库连接
async function testConnection() {
    return new Promise((resolve) => {
        db.get('SELECT 1 as test', (err, row) => {
            if (err) {
                console.error('数据库连接测试失败:', err.message);
                resolve(false);
            } else {
                console.log('数据库连接测试成功');
                resolve(true);
            }
        });
    });
}

// 执行SQL查询（Promise版本）
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 执行SQL语句（用于INSERT/UPDATE/DELETE）
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ 
                    lastID: this.lastID, 
                    changes: this.changes 
                });
            }
        });
    });
}

// 获取单行数据
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// 初始化数据库表
async function initDatabase() {
    try {
        console.log('开始初始化SQLite数据库...');
        
        // 创建物流渠道表
        await run(`
            CREATE TABLE IF NOT EXISTS logistics_channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_name TEXT NOT NULL,
                channel_type TEXT NOT NULL CHECK(channel_type IN ('海运','空运','铁路','卡航','快递')),
                destination_country TEXT NOT NULL,
                service_type TEXT,
                transit_time TEXT,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 创建地区邮编映射表
        await run(`
            CREATE TABLE IF NOT EXISTS postal_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                country TEXT NOT NULL,
                postal_code_prefix TEXT,
                zone_code TEXT NOT NULL,
                zone_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 创建起运地表
        await run(`
            CREATE TABLE IF NOT EXISTS origin_ports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                port_group TEXT NOT NULL,
                port_code TEXT NOT NULL,
                port_name TEXT NOT NULL,
                region TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 创建价格表
        await run(`
            CREATE TABLE IF NOT EXISTS pricing (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id INTEGER NOT NULL,
                origin_port_id INTEGER NOT NULL,
                destination_zone TEXT NOT NULL,
                weight_min REAL NOT NULL,
                weight_max REAL,
                price_per_kg REAL NOT NULL,
                additional_fees TEXT,
                effective_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES logistics_channels(id) ON DELETE CASCADE,
                FOREIGN KEY (origin_port_id) REFERENCES origin_ports(id) ON DELETE CASCADE
            )
        `);
        
        // 创建特殊规则表
        await run(`
            CREATE TABLE IF NOT EXISTS special_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id INTEGER NOT NULL,
                rule_type TEXT NOT NULL CHECK(rule_type IN ('size_limit','weight_limit','prohibited_items','surcharge','remote_fee')),
                rule_description TEXT NOT NULL,
                rule_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES logistics_channels(id) ON DELETE CASCADE
            )
        `);
        
        // 创建索引
        await run('CREATE INDEX IF NOT EXISTS idx_channels_country ON logistics_channels(destination_country)');
        await run('CREATE INDEX IF NOT EXISTS idx_channels_type ON logistics_channels(channel_type)');
        await run('CREATE INDEX IF NOT EXISTS idx_zones_country_postal ON postal_zones(country, postal_code_prefix)');
        await run('CREATE INDEX IF NOT EXISTS idx_pricing_channel_zone ON pricing(channel_id, destination_zone)');
        await run('CREATE INDEX IF NOT EXISTS idx_pricing_weight ON pricing(weight_min, weight_max)');
        
        console.log('SQLite数据库初始化完成');
        return true;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

// 清空所有数据
async function clearAllData() {
    try {
        await run('DELETE FROM pricing');
        await run('DELETE FROM special_rules');
        await run('DELETE FROM logistics_channels');
        await run('DELETE FROM postal_zones');
        await run('DELETE FROM origin_ports');
        console.log('数据清空完成');
    } catch (error) {
        console.error('清空数据失败:', error);
        throw error;
    }
}

// 关闭数据库连接
function closeDatabase() {
    return new Promise((resolve) => {
        db.close((err) => {
            if (err) {
                console.error('关闭数据库失败:', err.message);
            } else {
                console.log('数据库连接已关闭');
            }
            resolve();
        });
    });
}

module.exports = {
    db,
    query,
    run,
    get,
    testConnection,
    initDatabase,
    clearAllData,
    closeDatabase
};
