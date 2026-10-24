#!/usr/bin/env bash
# Publishes the 3 blog posts in this folder to novo.rickmff.com. Usage: bash publish.sh
set -euo pipefail
cd "$(dirname "$0")"
API=https://novo.rickmff.com/api/content
TOKEN="${PORTFOLIO_TOKEN:-$(cat ~/.config/portfolio/token)}"
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" $API/harness)
[ "$code" = 200 ] || { echo "token check failed: $code"; exit 1; }
existing=$(curl -s -H "Authorization: Bearer $TOKEN" $API/posts)
for f in ai-changed-where-i-spend-my-time the-harness-is-the-product running-my-finances-like-a-server; do
  if echo "$existing" | grep -q "\"slug\":\"$f\""; then echo "SKIP $f (slug exists)"; continue; fi
  banner=$(python3 -c "import json;print(json.load(open('$f.json'))['_banner'])")
  url=$(curl -s -H "Authorization: Bearer $TOKEN" -F "file=@$banner" $API/media | python3 -c "import json,sys;print(json.load(sys.stdin)['url'])")
  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  python3 -c "import json;d=json.load(open('$f.json'));d.pop('_banner');d['bannerUrl']='$url';d['publishedAt']='$now';print(json.dumps(d,ensure_ascii=False))" > /tmp/$f.payload.json
  res=$(curl -s -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' --data-binary @/tmp/$f.payload.json $API/posts)
  echo "POST $f -> $(echo "$res" | tail -1) banner=$url"
  echo "$res" | head -1 | cut -c1-300
  rm -f /tmp/$f.payload.json
  sleep 2
done
for f in ai-changed-where-i-spend-my-time the-harness-is-the-product running-my-finances-like-a-server; do
  echo "$f EN $(curl -s -o /dev/null -w '%{http_code}' -H 'Accept-Language: en' https://novo.rickmff.com/blog/$f) PT $(curl -s -o /dev/null -w '%{http_code}' -H 'Accept-Language: pt-BR' https://novo.rickmff.com/blog/$f)"
done
