const TextParser = require('../utils/textParser');

// 创建解析器实例
const parser = new TextParser();

// 测试用例
const testCases = [
    {
        name: '测试用例1 - 阿鲁巴联邦快递',
        input: '25*25*18 6.6KG Country Aruba City Oranjestad Address Hooiberg 64 Postal Code 0000 请计算一下 联邦快递',
        expected: {
            dimensions: { length: 25, width: 25, height: 18 },
            weight: 6.6,
            country: 'Aruba',
            city: 'Oranjestad',
            address: 'Hooiberg 64',
            postalCode: '0000',
            shippingMethods: ['FedEx']
        }
    },
    {
        name: '测试用例2 - 加拿大窗帘轨道',
        input: '加拿大，3221 Redpath Circle,mississauga Ontario产品:窗帘轨道材质:铝合金抛货 -1件尺寸:185CM*35CM*40CM海派报价:快递报价:',
        expected: {
            country: 'Canada',
            city: 'Mississauga',
            address: '3221 Redpath Circle',
            productInfo: '窗帘轨道',
            material: '铝合金抛货',
            quantity: 1,
            dimensions: { length: 185, width: 35, height: 40 },
            shippingMethods: ['Sea Shipping', 'Express']
        }
    },
    {
        name: '测试用例3 - 美国洛杉矶',
        input: '美国洛杉矶 90210 30*20*15 8.5kg DHL快递',
        expected: {
            country: 'USA',
            postalCode: '90210',
            dimensions: { length: 30, width: 20, height: 15 },
            weight: 8.5,
            shippingMethods: ['DHL']
        }
    },
    {
        name: '测试用例4 - 英国伦敦',
        input: '英国伦敦 SW1A 1AA 产品:电子产品 重量:12.5公斤 尺寸:50x40x30cm UPS',
        expected: {
            country: 'UK',
            postalCode: 'SW1A1AA',
            productInfo: '电子产品',
            weight: 12.5,
            dimensions: { length: 50, width: 40, height: 30 },
            shippingMethods: ['UPS']
        }
    }
];

console.log('🧪 开始测试文本解析器...\n');

testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`输入: ${testCase.input}`);
    
    const result = parser.parseUserInput(testCase.input);
    
    console.log('解析结果:');
    console.log(`- 成功: ${result.isSuccess}`);
    console.log(`- 尺寸: ${result.dimensions ? `${result.dimensions.length}×${result.dimensions.width}×${result.dimensions.height}cm` : '未识别'}`);
    console.log(`- 重量: ${result.weight ? `${result.weight}kg` : '未识别'}`);
    console.log(`- 国家: ${result.country || '未识别'}`);
    console.log(`- 城市: ${result.city || '未识别'}`);
    console.log(`- 地址: ${result.address || '未识别'}`);
    console.log(`- 邮编: ${result.postalCode || '未识别'}`);
    console.log(`- 物流方式: ${result.shippingMethods.length > 0 ? result.shippingMethods.join(', ') : '未识别'}`);
    console.log(`- 产品: ${result.productInfo || '未识别'}`);
    console.log(`- 材质: ${result.material || '未识别'}`);
    console.log(`- 数量: ${result.quantity || '未识别'}`);
    
    if (result.errors.length > 0) {
        console.log(`- 错误: ${result.errors.join(', ')}`);
    }
    
    console.log('\n格式化结果:');
    console.log(parser.formatResult(result));
    
    console.log('\n' + '='.repeat(80) + '\n');
});

console.log('✅ 测试完成！');

// 交互式测试
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('💬 交互式测试模式（输入 "exit" 退出）:');

function askForInput() {
    rl.question('\n请输入要解析的文本: ', (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log('👋 再见！');
            rl.close();
            return;
        }
        
        if (input.trim()) {
            console.log('\n📝 解析结果:');
            const result = parser.parseUserInput(input);
            console.log(parser.formatResult(result));
            
            if (!result.isSuccess) {
                console.log('\n❌ 解析失败，请检查输入格式');
            }
        }
        
        askForInput();
    });
}

askForInput();
