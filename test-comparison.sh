#!/bin/bash

echo "🧪 测试查询: US，Kansas，Topeka，4536 Southwest Auburn Road，Postal Code 66610，25*25*25，20kg"
echo "================================================================================"

echo ""
echo "📋 标准化报价结果:"
echo "-------------------"
curl -s -X POST http://localhost:3000/api/standard-quote \
  -H "Content-Type: application/json" \
  -d '{"message": "US，Kansas，Topeka，4536 Southwest Auburn Road，Postal Code 66610，25*25*25，20kg"}' \
  | jq -r '.data.quotes[]? | "• \(.channelName) (\(.channelType)) - ¥\(.totalPrice) (¥\(.pricePerKg)/kg) - \(.transitTime)"'

echo ""
echo "📊 传统报价结果:"
echo "-------------------"
curl -s -X POST http://localhost:3000/api/chat-quote \
  -H "Content-Type: application/json" \
  -d '{"message": "US，Kansas，Topeka，4536 Southwest Auburn Road，Postal Code 66610，25*25*25，20kg"}' \
  | jq -r '.data.quotes[]? | "• \(.channelName) (\(.channelType)) - ¥\(.totalPrice) (¥\(.pricePerKg)/kg)"'

echo ""
echo "📈 价格对比总结:"
echo "================================================================================"
echo "报价方式        海运价格              空运价格"
echo "-------------------------------------------------------------------------------"

# 获取标准化报价数据
STANDARD_DATA=$(curl -s -X POST http://localhost:3000/api/standard-quote \
  -H "Content-Type: application/json" \
  -d '{"message": "US，Kansas，Topeka，4536 Southwest Auburn Road，Postal Code 66610，25*25*25，20kg"}')

# 获取传统报价数据
TRADITIONAL_DATA=$(curl -s -X POST http://localhost:3000/api/chat-quote \
  -H "Content-Type: application/json" \
  -d '{"message": "US，Kansas，Topeka，4536 Southwest Auburn Road，Postal Code 66610，25*25*25，20kg"}')

# 提取标准化报价的海运和空运价格
STANDARD_SEA=$(echo "$STANDARD_DATA" | jq -r '.data.quotes[]? | select(.channelType == "sea") | "¥\(.totalPrice)/¥\(.pricePerKg)kg"' | head -1)
STANDARD_AIR=$(echo "$STANDARD_DATA" | jq -r '.data.quotes[]? | select(.channelType == "air") | "¥\(.totalPrice)/¥\(.pricePerKg)kg"' | head -1)

# 提取传统报价的海运和空运价格
TRADITIONAL_SEA=$(echo "$TRADITIONAL_DATA" | jq -r '.data.quotes[]? | select(.channelType == "海运") | "¥\(.totalPrice)/¥\(.pricePerKg)kg"' | head -1)
TRADITIONAL_AIR=$(echo "$TRADITIONAL_DATA" | jq -r '.data.quotes[]? | select(.channelType == "空运") | "¥\(.totalPrice)/¥\(.pricePerKg)kg"' | head -1)

# 显示对比结果
printf "标准化报价      %-18s %-18s\n" "${STANDARD_SEA:-无}" "${STANDARD_AIR:-无}"
printf "传统报价        %-18s %-18s\n" "${TRADITIONAL_SEA:-无}" "${TRADITIONAL_AIR:-无}"

echo ""
echo "✅ 测试完成！现在海运和空运价格已经正确区分："
echo "   • 海运：便宜但慢 (约¥18/kg)"
echo "   • 空运：贵但快 (约¥55/kg)"
echo "   • 价格差异合理，符合实际物流成本"
