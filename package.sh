#!/bin/sh
# 配布用の zip を作る。ストアに要らないもの (テスト・ドキュメント・
# このスクリプト自身) は入れない。
set -eu

cd "$(dirname "$0")"
out=wayback-mojibake-fix.zip

rm -f "$out"
zip -r -q "$out" \
	manifest.json \
	_locales \
	icons \
	src \
	README.md \
	LICENSE \
	-x '*.DS_Store'

echo "$out"
unzip -l "$out" | tail -1
