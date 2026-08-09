#!/bin/bash
# 批量修复分类（兼容 macOS bash 3.x）

source .env.local

URL="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/prompts"
KEY="${SUPABASE_SERVICE_ROLE_KEY}"

update_category() {
  local old="$1"
  local new="$2"
  echo "更新 $old → $new"
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "${URL}?category=eq.${old}" \
    -H "apikey: ${KEY}" \
    -H "Authorization: Bearer ${KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"category\":\"${new}\"}")
  echo "  HTTP: $http_code"
}

# 拼音分类修复
update_category "guo-feng" "chinese-style"
update_category "dong-man" "anime"
update_category "she-ying" "photography"

# 错误分类修复
update_category "commercial" "product"
update_category "cinematic" "photography"
update_category "concept-art" "concept_art"

echo "分类修复完成"
