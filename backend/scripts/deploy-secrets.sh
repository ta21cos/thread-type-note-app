#!/usr/bin/env bash
set -euo pipefail

# === 引数チェック ===
if [ $# -lt 1 ]; then
  echo "Usage: $0 <environment>"
  echo "Example: $0 production"
  exit 1
fi

ENV="$1"
FILE=".dev.vars.${ENV}"

if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

echo "🔐 Setting secrets from: $FILE (env=$ENV)"

# === .dev.vars.{env} を1行ずつ読み込み ===
while IFS='=' read -r key value; do
  # 空行やコメント行をスキップ
  [[ -z "$key" || "$key" == \#* ]] && continue

  # 前後の空白除去
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  if [ -z "$value" ]; then
    echo "⚠️  Skipping empty value for key: $key"
    continue
  fi

  echo "➡️  Setting $key ..."
  echo "$value" | wrangler secret put "$key" --env "$ENV" 
done < "$FILE"

echo "✅ All secrets set for environment: $ENV"
