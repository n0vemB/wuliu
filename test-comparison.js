const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const testQuery = "10748 Northwest 12th Manor,Plantation,Florida,United States,33322，62.6*62.6*34.2，14kg，单价18";

async function testAllQuoteMethods() {
    console.log('🧪 测试查询:', testQuery);
    console.log('=' .repeat(80));
    
    try {
        // 1. 标准化报价
        console.log('\n📋 标准化报价结果:');
        const standardResponse = await fetch(`${API_BASE}/standard-quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: testQuery })
        });
        const standardData = await standardResponse.json();
        
        if (standardData.success && standardData.data.quotes) {
            standardData.data.quotes.forEach((quote, index) => {
                console.log(`${index + 1}. ${quote.channelName}`);
                console.log(`   类型: ${quote.channelType}`);
                console.log(`   时效: ${quote.transitTime}`);
                console.log(`   价格: ¥${quote.totalPrice} (¥${quote.pricePerKg}/kg)`);
                if (quote.schedule) console.log(`   船期: ${quote.schedule}`);
                console.log('');
            });
        } else {
            console.log('   无可用报价');
        }
        
        // 2. 传统报价
        console.log('\n📊 传统报价结果:');
        const traditionalResponse = await fetch(`${API_BASE}/chat-quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: testQuery })
        });
        const traditionalData = await traditionalResponse.json();
        
        if (traditionalData.success && traditionalData.data.quotes) {
            traditionalData.data.quotes.forEach((quote, index) => {
                console.log(`${index + 1}. ${quote.channelName}`);
                console.log(`   类型: ${quote.channelType}`);
                console.log(`   时效: ${quote.transitTime || '待确认'}`);
                console.log(`   价格: ¥${quote.totalPrice} (¥${quote.pricePerKg}/kg)`);
                console.log('');
            });
        } else {
            console.log('   无可用报价');
        }
        
        // 3. AI报价 (如果可用)
        console.log('\n🤖 AI报价结果:');
        const aiResponse = await fetch(`${API_BASE}/ai-quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: testQuery })
        });
        const aiData = await aiResponse.json();
        
        if (aiData.success) {
            if (aiData.data.type === 'ai_unavailable') {
                console.log('   AI服务未配置');
            } else if (aiData.data.aiResult && aiData.data.aiResult.quotes) {
                aiData.data.aiResult.quotes.forEach((quote, index) => {
                    console.log(`${index + 1}. ${quote.channelName}`);
                    console.log(`   类型: ${quote.serviceType || 'N/A'}`);
                    console.log(`   时效: ${quote.transitTime || 'N/A'}`);
                    console.log(`   价格: ¥${quote.totalPrice} (¥${quote.pricePerKg}/kg)`);
                    console.log('');
                });
            } else {
                console.log('   AI报价失败，已降级到传统方式');
            }
        } else {
            console.log('   AI报价服务不可用');
        }
        
        // 4. 对比总结
        console.log('\n📈 价格对比总结:');
        console.log('=' .repeat(50));
        
        const standardQuotes = standardData.success ? standardData.data.quotes || [] : [];
        const traditionalQuotes = traditionalData.success ? traditionalData.data.quotes || [] : [];
        
        console.log('报价方式\t\t海运价格\t\t空运价格');
        console.log('-'.repeat(50));
        
        // 标准化报价
        const standardSea = standardQuotes.find(q => q.channelType === 'sea');
        const standardAir = standardQuotes.find(q => q.channelType === 'air');
        console.log(`标准化报价\t\t${standardSea ? '¥' + standardSea.totalPrice + '/¥' + standardSea.pricePerKg + 'kg' : '无'}\t\t${standardAir ? '¥' + standardAir.totalPrice + '/¥' + standardAir.pricePerKg + 'kg' : '无'}`);
        
        // 传统报价
        const traditionalSea = traditionalQuotes.find(q => q.channelType === '海运');
        const traditionalAir = traditionalQuotes.find(q => q.channelType === '空运');
        console.log(`传统报价\t\t${traditionalSea ? '¥' + traditionalSea.totalPrice + '/¥' + traditionalSea.pricePerKg + 'kg' : '无'}\t\t${traditionalAir ? '¥' + traditionalAir.totalPrice + '/¥' + traditionalAir.pricePerKg + 'kg' : '无'}`);
        
        console.log('\n✅ 测试完成！');
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 运行测试
testAllQuoteMethods();
