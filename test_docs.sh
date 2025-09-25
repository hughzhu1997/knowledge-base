#!/bin/bash

# 配置
EMAIL="admin@example.com"
PASSWORD="123456"
BASE_URL="http://localhost:3000"

echo "🔑 登录获取 Token..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，请检查账号和密码"
  exit 1
fi

echo "✅ 登录成功，Token: $TOKEN"

echo ""
echo "📄 创建文档..."
DOC=$(curl -s -X POST $BASE_URL/api/docs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"First Doc","category":"prd","content":"Hello Knowledge Base"}')

DOC_ID=$(echo $DOC | jq -r '.document.id')
echo "✅ 文档已创建，ID: $DOC_ID"
echo "文档内容: $DOC"

echo ""
echo "📑 获取文档列表..."
curl -s $BASE_URL/api/docs -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "🔍 获取单个文档..."
curl -s $BASE_URL/api/docs/$DOC_ID -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "✏️ 更新文档..."
UPDATED=$(curl -s -X PUT $BASE_URL/api/docs/$DOC_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Doc","content":"This is an updated content"}')
echo "更新结果: $UPDATED"

echo ""
echo "🗑️ 删除文档..."
curl -s -X DELETE $BASE_URL/api/docs/$DOC_ID -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "✅ 测试完成"

