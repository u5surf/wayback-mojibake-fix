#!/bin/sh
# Obtains a Chrome Web Store refresh token for CWS_REFRESH_TOKEN.
#
# A desktop OAuth client does get a client secret, and Google's token endpoint
# rejects the exchange without it ("client_secret is missing") even though the
# docs call the parameter optional. PKCE is still used on top of it: the secret
# ships with the client and is not treated as confidential.
#
# Run once. The refresh token that comes out does not expire as long as the
# OAuth app's publishing status stays "In production".
set -eu

if [ $# -ne 2 ]; then
	echo "usage: $0 <CLIENT_ID> <CLIENT_SECRET>" >&2
	exit 1
fi
client_id=$1
client_secret=$2
redirect_uri=http://localhost:8080

# PKCE. The verifier is the secret; the challenge is its SHA-256, base64url
# encoded without padding.
verifier=$(openssl rand -base64 96 | tr -d '\n=+/' | cut -c1-64)
challenge=$(printf %s "$verifier" |
	openssl dgst -binary -sha256 |
	openssl base64 |
	tr '+/' '-_' |
	tr -d '=\n')

# access_type=offline is what makes Google return a refresh token at all.
# prompt=consent forces a fresh one even if this client was authorized before.
cat <<EOF

1. 次の URL をブラウザで開いて承認する

https://accounts.google.com/o/oauth2/v2/auth?response_type=code&access_type=offline&prompt=consent&scope=https%3A//www.googleapis.com/auth/chromewebstore&client_id=$client_id&redirect_uri=$redirect_uri&code_challenge=$challenge&code_challenge_method=S256

   「このアプリは Google で確認されていません」と出たら
   「詳細」→「(アプリ名) に移動」で進む。

2. 承認後、ブラウザは localhost:8080 への接続に失敗する (待ち受けが無いので
   正常)。アドレスバーの code= の値をコピーする。

EOF

printf '3. その code を貼り付けて Enter: '
read -r code

# The authorization code is single-use and expires within minutes.
response=$(curl -sS \
	-d "client_id=$client_id" \
	-d "client_secret=$client_secret" \
	-d "code=$code" \
	-d "code_verifier=$verifier" \
	-d "grant_type=authorization_code" \
	-d "redirect_uri=$redirect_uri" \
	https://oauth2.googleapis.com/token)

token=$(printf %s "$response" | sed -n 's/.*"refresh_token": *"\([^"]*\)".*/\1/p')
if [ -z "$token" ]; then
	echo >&2
	echo "refresh token を取得できなかった。応答:" >&2
	printf '%s\n' "$response" >&2
	echo >&2
	echo "code は数分で失効し 1 度しか使えない。やり直す場合はこのスクリプトを" >&2
	echo "最初から実行すること (code_verifier も作り直す必要がある)。" >&2
	exit 1
fi

echo
echo "CWS_REFRESH_TOKEN:"
echo "$token"
echo
echo "これを GitHub の Settings > Secrets and variables > Actions に登録する。"
