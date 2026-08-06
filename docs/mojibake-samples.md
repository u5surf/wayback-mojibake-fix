# 文字化けサンプル一覧

Wayback Machine 上で**文字コードの宣言が無い**アーカイブページの実測一覧。
`docs/manual-test.md` の目視確認で使う。

計測日: 2026-08-06 / スクリプト: 生バイト列を取得して `src/detect.js` に掛けたもの。

## この表で分かること・分からないこと

分かるのは「**ブラウザが推測を強いられる状態か**」と「**正解は何か**」まで。
`Content-Type` にも `<meta>` にも charset が無ければ、ブラウザは推測するしかない。

分からないのは「**Chrome がその推測に成功するか**」。Chrome には文字コードの
自動判別が入っており、当たるページもあれば外すページもある。これは実機でしか
確かめられないので、右端の列は空けてある。

拡張は `document.characterSet` と判定結果が一致すれば何もしないので、Chrome が
当てているページでは「変換は不要でした」になり、ON/OFF トグルも出ない。
**ポップアップの表示がそのまま「Chrome が当てたかどうか」の答えになる。**

## 宣言が無いページ (ブラウザが推測を強いられる)

`Content-Type` の charset も `<meta charset>` も無く、日本語として判定できたもの。

| # | ページ | Wayback のヒント | 正解 | 判定の根拠 | 非 ASCII | 正しいタイトル | Chrome 実測 |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| 1 | [tbs.co.jp 2000](https://web.archive.org/web/20001212075700/http://www.tbs.co.jp/tengoku/index-j2.html) | shift_jis | `shift_jis` | hint | 90 (3.3%) | 天国に一番近い男 | |
| 2 | [tbs.co.jp 2000 (子フレーム)](https://web.archive.org/web/20001212075700fw_/http://www.tbs.co.jp/tengoku/f_main-j.html) | shift_jis | `shift_jis` | hint | 14 (0.7%) | 天国に一番近い男 | |
| 3 | [geocities.jp 2007](https://web.archive.org/web/20070825113202/http://www.geocities.jp/burontosan/) | euc-jp | `euc-jp` | hint | 90 (4.4%) | ブロントさん名言集 | |
| 4 | [asahi-net.or.jp 2001](https://web.archive.org/web/20010517021236/http://www.asahi-net.or.jp/~wj3a-fji/) | shift_jis | `shift_jis` | hint | 304 (8.3%) | 『あぽ』のホームページ | |
| 5 | [biglobe.ne.jp 2000](https://web.archive.org/web/20000925190519/http://www2a.biglobe.ne.jp/~hirapon/) | shift_jis | `shift_jis` | hint | 9012 (17.2%) | ちゃりみっくす | |
| 6 | [orchid.co.jp 1998](https://web.archive.org/web/19980210015200/http://orchid.co.jp/computer/linux/linux.html) | iso-2022-jp | `iso-2022-jp` | escape-sequence | 0 (0.0%) | Linux | |
| 7 | [nikkei.co.jp 1998](https://web.archive.org/web/19981212034354/http://www2.nikkei.co.jp/) | shift_jis | `shift_jis` | hint | 304 (9.6%) | NIKKEI NET | |
| 8 | [yahoo.co.jp 1997](https://web.archive.org/web/19971211142311/http://www.yahoo.co.jp/) | latin1 | `euc-jp` | heuristic(0.82) | 1124 (6.4%) | Yahoo! JAPAN | |
| 9 | [sony.co.jp 1997](https://web.archive.org/web/19970121050427/http://www1.sony.co.jp:80/) | shift_jis | `shift_jis` | hint | 18 (0.4%) | www1.sony.co.jp | |
| 10 | [nintendo.co.jp 1998](https://web.archive.org/web/19980205054211/http://www.nintendo.co.jp:80/) | shift_jis | `shift_jis` | hint | 663 (10.8%) | 任天堂ホームページ | |
| 11 | [asahi.com 1998](https://web.archive.org/web/19980115075906/http://www.asahi.com:80/) | shift_jis | `shift_jis` | hint | 686 (8.6%) | Asahi NewsPaper Index | |
| 12 | [mainichi.co.jp 1999](https://web.archive.org/web/19990125090745/http://mainichi.co.jp:80/) | shift_jis | `shift_jis` | hint | 1420 (9.4%) | 毎日新聞社のホームページ ジャムジャム | |
| 13 | [watch.impress.co.jp 1998](https://web.archive.org/web/19980115025453/http://watch.impress.co.jp:80/) | shift_jis | `shift_jis` | hint | 795 (7.5%) | Watch Home Page | |
| 14 | [jal.co.jp 1998](https://web.archive.org/web/19980123041312/http://www.jal.co.jp:80/) | shift_jis | `shift_jis` | hint | 1048 (6.9%) | Japan Airlines INDEX | |
| 15 | [nikkansports.com 1999](https://web.archive.org/web/19990125091118/http://nikkansports.com:80/) | shift_jis | `shift_jis` | hint | 1529 (8.4%) | ニッカンスポーツ・コム・インデックス | |
| 16 | [sponichi.co.jp 2000](https://web.archive.org/web/20000510033306/http://www.sponichi.co.jp:80/) | shift_jis | `shift_jis` | hint | 1380 (3.6%) | スポニチアネックス | |
| 17 | [kantei.go.jp 1998](https://web.archive.org/web/19980128134919/http://www.kantei.go.jp:80/) | euc-jp | `euc-jp` | hint | 1472 (14.7%) | 首相官邸 | |
| 18 | [member.nifty.ne.jp 2001](https://web.archive.org/web/20011121161327/http://member.nifty.ne.jp/papa-goma/) | iso-2022-jp | `iso-2022-jp` | escape-sequence | 0 (0.0%) | Not Found (本文は日本語) | Shift_JIS と誤判別 |

### 化けたときの見え方 (タイトル)

ブラウザが既定の windows-1252 で読んだ場合。ここが一致していれば「推測に失敗した」
状態だと一目で分かる。

| # | 正しい表示 | windows-1252 で読んだときの見え方 |
| --- | --- | --- |
| 1, 2 | 天国に一番近い男 | `` “V‘‚Éˆê”Ô‹ß‚¢’j `` |
| 3 | ブロントさん名言集 | `` ¥Ö¥í¥ó¥È¤µ¤óÌ¾¸À½¸ `` |
| 4 | 『あぽ』のホームページ | `` w‚ ‚Ûx‚Ìƒz[ƒ€ƒy[ƒW `` |
| 5 | ちゃりみっくす | `` ‚¿‚á‚è‚Ý‚Á‚­‚· `` |
| 10 | 任天堂ホームページ | `` ”C“V“°ƒz[ƒ€ƒy[ƒW `` |
| 12 | 毎日新聞社のホームページ ジャムジャム | `` –ˆ“úV•·ŽÐ‚Ìƒz[ƒ€ƒy[ƒW@ƒWƒƒƒ€ƒWƒƒƒ€ `` |
| 15 | ニッカンスポーツ・コム・インデックス | `` ƒjƒbƒJƒ“ƒXƒ\|[ƒcEƒRƒ€EƒCƒ“ƒfƒbƒNƒX `` |
| 16 | スポニチアネックス | `` ƒXƒ\|ƒjƒ`ƒAƒlƒbƒNƒX `` |
| 17 | 首相官邸 | `` ¼óÁê´±Å¡ `` |

**6, 7, 8, 9, 11, 13, 14 はタイトルが ASCII のみ**なので、タブのタイトルでは
判別できない。本文を見ること。

## 特徴のあるページ

- **2** — frameset の子フレーム。charset 宣言が無い同一オリジンの iframe は、
  仕様上**親文書の文字コードを継承**する。Wayback のラッパーは UTF-8 なので、
  継承が起きると自動判別の出番が無くなる。ここが Chrome の判別で最も割れやすい
- **6** — ISO-2022-JP。**非 ASCII バイトが 1 つも無い** (全バイトが 7bit)。
  自動判別が「ASCII」と結論すればエスケープシーケンスは素通りする
- **8** — Wayback のヒントが `latin1` で、**明確に間違っている**。拡張は
  ヒントの裏を取って退け、統計スコア (0.82) で `euc-jp` に辿り着いている
- **9** — 非 ASCII が 18 バイト (0.4%) しかない。自動判別の材料としては最小級
- **2, 9** — 非 ASCII が 1% 未満。判別器が材料不足で外しやすい
- **18** — **応答が HTTP 404**。保存されているのが nifty の日本語エラーページ
  (「ページが見つかりません」) で、Wayback が当時のステータスをそのまま再生する。
  ブラウザは本文を普通に描画するので、拡張も対象にしなければならない。
  Chrome の実測で `document.characterSet` が `Shift_JIS` を返しており、
  **自動判別が明確に外している**ことが確認できた唯一のサンプル

## 対照群 (宣言があるか、日本語でないページ)

拡張の ON/OFF で**表示が変わってはいけない**もの。

| # | ページ | ヒント | 判定 | 根拠 | 期待する動作 |
| --- | --- | --- | --- | --- | --- |
| A | [fctv.ne.jp 2000](https://web.archive.org/web/20000929071705/http://www1.fctv.ne.jp/~shimazu/) | shift_jis | `shift_jis` | meta | 宣言どおり。400 KB 近い大きなページ |
| B | [2ch.net 2002](https://web.archive.org/web/20020329054553/http://2ch.net/) | shift_jis | `shift_jis` | meta | 宣言どおり |
| C | [goo.ne.jp 1999](https://web.archive.org/web/19990125085933/http://goo.ne.jp:80/) | euc-jp | `euc-jp` | meta | 宣言どおり |
| D | [yahoo.co.jp 2020](https://web.archive.org/web/20201231232740/https://www.yahoo.co.jp/) | utf-8 | `utf-8` | valid-utf8 | UTF-8 なので介入しない |
| E | [ntt.co.jp 1998](https://web.archive.org/web/19980208014341/http://www.ntt.co.jp:80/) | utf-8 | `utf-8` | valid-utf8 | 日本語を含まない純 ASCII |
| F | [naver.com 2003](https://web.archive.org/web/20030124134931/http://naver.com/) | uhc | — | **fallback** | 韓国語。かなの裏取りで退け、**何もしない** |
| G | [chinanews.com.cn 2001](https://web.archive.org/web/20011009000100/http://www.chinanews.com.cn/) | gb18030 | `gbk` | meta | 中国語。宣言があるので正しく読める |

**F が最重要。** かなの裏取りを入れる前は EUC-KR を EUC-JP と誤判定し、正常表示
できていたページを壊していた。

## 表を作り直す

判定ロジックを変えたら実測し直すこと。URL 一覧とスクリプトはこのファイルの
表そのものから起こせる (生バイトを取得して `wjpDetect` に掛けるだけ)。
