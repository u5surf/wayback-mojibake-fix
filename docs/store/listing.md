# ストア掲載情報

Chrome Web Store と Firefox Add-ons (AMO) に貼るテキスト一式。
スクリーンショットは `screenshots/` にある (`node docs/store/build.js` で再生成)。

| ファイル | 用途 | サイズ |
| --- | --- | --- |
| `{ja,en}-1-hero.png` | 1 枚目。Before / After | 1280×800 |
| `{ja,en}-2-detect.png` | 自動判定の実例 | 1280×800 |
| `{ja,en}-3-popup.png` | 手動指定の UI | 1280×800 |
| `{ja,en}-4-how.png` | サーバ不要・URL そのまま | 1280×800 |
| `{ja,en}-5-safe.png` | 触らない範囲 | 1280×800 |
| `{ja,en}-tile.png` | Chrome の小プロモタイル | 440×280 |

---

## Chrome Web Store

- カテゴリ: ユーティリティ (Tools)
- 言語: 日本語 (既定)、英語
- 価格: 無料

### 名前 (75 文字以内)

```
Wayback 文字化けフィックス
```

### 概要 / Short description (132 文字以内)

```
Wayback Machine の昔の日本語ページの文字化けを自動で直します。Shift_JIS / EUC-JP / ISO-2022-JP を判定して読めるようにします。
```

### 詳細な説明

```
Internet Archive の Wayback Machine で 2000 年前後の日本語ページを開くと、
文字化けして読めないことがあります。この拡張は、その文字コードを自動で
判定して正しく表示します。

インストールしたら、あとは web.archive.org をいつもどおり開くだけです。
URL を書き換える必要も、設定も、アカウントも要りません。


■ なぜ化けるのか

Wayback の保存ミスではありません。バイト列は無傷で残っています。

当時の日本語ページは、文字コードをどこにも宣言していないことがほとんど
でした。ブラウザが自動判別してくれたので、書く習慣が無かったのです。
ところが現代のブラウザは、セキュリティ上の理由から自動判別をやめました。
その結果、宣言の無いページはロケール既定 (多くは windows-1252) で解釈され、
Shift_JIS のバイト列が意味不明な記号の羅列になります。

つまり、正しい文字コードを教えてやるだけで読めるようになります。


■ 判定のしくみ

上から順に試し、必ず実際にデコードして日本語として自然かを検証してから
採用します。当時のページは平気で嘘の charset を書くため、宣言があっても
鵜呑みにはしません。

 1. エスケープシーケンス (ISO-2022-JP は一意に決まります)
 2. UTF-8 として妥当ならそのまま
 3. ページ内の <meta charset> 宣言
 4. Wayback が持っている推定値
 5. Shift_JIS / EUC-JP / ISO-2022-JP を総当たりし、統計スコアが最良のもの

スコアは、ひらがな・カタカナ・和文約物・漢字を加点し、私用領域・半角カナ・
デコード不能バイトを減点して算出します。誤った文字コードで読むと記号ばかりが
並ぶので、これで十分に判別できます。

判定が外れたときは、ツールバーのアイコンから手動で指定できます。


■ 壊さないための線引き

・UTF-8 として正しく読めるページには一切触りません
・ブラウザが既に正しく解釈しているページも素通りします
・Wayback のツールバーとリンク書き換えはそのまま残ります
・HTML 以外 (画像・PDF・スクリプト) は 1 バイトも触りません


■ プライバシーと通信

・アクセスできるのは web.archive.org だけです。他のサイトは一切見ません
・閲覧履歴の収集も、外部への送信も、一切しません
・広告なし、課金なし、アカウント登録なし
・文字コードの判定にはページを HTTP キャッシュから読み直します。そのため
  Internet Archive への負荷はほとんど増えません

Internet Archive は非営利のアーカイブです。この拡張は、そこへ余計な負荷を
掛けないことを設計上の条件にしています。


■ 対応している文字コード

Shift_JIS (x-sjis / ms_kanji / windows-31j などの表記揺れを含む)
EUC-JP
ISO-2022-JP

自動判定の対象は日本語ページです。ページ自身が文字コードを宣言している
場合は、日本語以外でもその宣言に従って表示します (中国語のページなど)。
判定できないときは何もせず、ブラウザの表示をそのまま残します。


■ ソースコード

MIT ライセンスで公開しています。
https://github.com/u5surf/wayback-mojibake-fix
```

### プライバシー関連の申告

審査で必ず聞かれる項目。

**単一用途 (Single purpose)**

```
Wayback Machine 上の、文字コードが宣言されていないアーカイブページの
文字化けを修正して表示する。これ以外の機能は持たない。
```

**権限の正当性**

| 権限 | 説明 |
| --- | --- |
| `activeTab` | ツールバーのポップアップを開いたときに、現在のタブへ判定結果を問い合わせ、手動指定を伝えるため。 |
| `host_permissions: *://web.archive.org/*` | 文字コードを判定する対象が web.archive.org 上のアーカイブページに限られるため。判定にはページのバイト列そのものが必要で、それを取得できるのはこのホストに対する権限だけ。 |
| リモートコードの使用 | **なし。** すべてのコードは拡張のパッケージに同梱されている。 |

**データの取り扱い**

以下すべて「収集しない」で申告する。

```
個人情報 / 健康情報 / 金融情報 / 認証情報 / 個人的な通信内容 /
位置情報 / ウェブ閲覧履歴 / ユーザー活動 / ウェブサイトのコンテンツ

いずれも収集しない。拡張はいかなるデータも外部へ送信しない。
文字コードの判定はすべて利用者のブラウザ内で完結する。
```

---

## Firefox Add-ons (AMO)

### 名前 (50 文字以内)

```
Wayback 文字化けフィックス
```

### 概要 / Summary (250 文字以内)

```
Wayback Machine に残る昔の日本語ページの文字化けを自動で直します。Shift_JIS / EUC-JP / ISO-2022-JP を判定し、正しい文字コードで読み直して表示します。URL の書き換えも設定も不要で、web.archive.org を開くだけです。
```

### 説明

Chrome の「詳細な説明」をそのまま使う。AMO は簡単な HTML が使えるので、
見出しを `<b>` に、箇条書きを `<ul><li>` に置き換えると読みやすい。

### タグ

```
wayback machine, internet archive, 文字化け, mojibake, shift_jis, euc-jp,
japanese, encoding, charset, archive
```

### 審査者向けメモ (Notes to reviewer)

```
このアドオンは web.archive.org 上のアーカイブページのみを対象に動作します。

動作の確認手順:
 1. https://web.archive.org/web/20001212075700/http://www.tbs.co.jp/tengoku/index-j2.html
    を開く
 2. アドオンを無効にすると、タイトルが「“V‘‚Éˆê”Ô‹ß‚¢’j」のように化ける
 3. 有効にすると「天国に一番近い男」と表示される

処理内容:
 コンテンツスクリプトが同じ URL を fetch({cache:'force-cache'}) で読み直し、
 生バイト列から文字コードを判定して TextDecoder でデコードし、
 document.write で文書を差し替えます。

 元のバイト列がブラウザに渡った時点で不正なバイトは U+FFFD に置換されて
 いるため、DOM からは復元できません。取り直す以外に手段がありません。

 難読化されたコードは含みません。ソースは以下で公開しています。
 https://github.com/u5surf/wayback-mojibake-fix
```

---

## English

### Name

```
Wayback Mojibake Fix
```

### Short description (132)

```
Fixes garbled Japanese pages on the Wayback Machine by detecting Shift_JIS / EUC-JP / ISO-2022-JP and decoding them correctly.
```

### Detailed description

```
Japanese pages archived on the Internet Archive's Wayback Machine from around
2000 often render as meaningless symbols. This extension detects their real
character encoding and displays them correctly.

Install it and just browse web.archive.org as usual. No URL rewriting, no
configuration, no account.


WHY THEY BREAK

Nothing is wrong with the archive. The stored bytes are intact.

Japanese pages of that era usually declared no character encoding at all --
browsers autodetected it, so nobody bothered. Modern browsers dropped
autodetection for security reasons, so an undeclared page is now interpreted
using a locale default (usually windows-1252), turning Shift_JIS bytes into
gibberish.

The bytes only need to be labelled correctly to become readable again.


HOW DETECTION WORKS

Candidates are tried in order, and each one is actually decoded and checked
for whether it reads as natural Japanese before being accepted. Pages of that
era frequently declared an encoding that was simply wrong, so a declaration is
never taken at face value.

 1. Escape sequences (these identify ISO-2022-JP unambiguously)
 2. Valid UTF-8 is left alone
 3. The <meta charset> declaration in the page
 4. The encoding the Wayback Machine itself guessed
 5. Brute force over Shift_JIS / EUC-JP / ISO-2022-JP, scored statistically

Scoring rewards hiragana, katakana, Japanese punctuation and kanji, and
penalises private-use characters, half-width katakana and undecodable bytes.
A wrong codec produces a stream of stray symbols, which the score separates
reliably.

If the detection is wrong, override it from the toolbar popup.


WHAT IT REFUSES TO TOUCH

- Pages that already decode as valid UTF-8
- Pages the browser is already interpreting correctly
- The Wayback toolbar and its link rewriting, which stay intact
- Anything that is not HTML: images, PDFs, scripts


PRIVACY AND NETWORK USE

- It can only access web.archive.org. It never sees any other site
- It collects no browsing history and sends nothing anywhere
- No ads, no payments, no accounts
- Detection re-reads the page from the HTTP cache, so it adds virtually no
  load to the Internet Archive

The Internet Archive is a non-profit. Not adding load to it was a design
constraint for this extension.


SUPPORTED ENCODINGS

Shift_JIS (including x-sjis, ms_kanji, windows-31j and other spellings)
EUC-JP
ISO-2022-JP

Automatic detection targets Japanese pages. If a page declares its own
encoding, that declaration is honoured even for other languages (Chinese
pages, for example). When nothing can be determined, the extension does
nothing and leaves the browser's rendering alone.


SOURCE CODE

MIT licensed: https://github.com/u5surf/wayback-mojibake-fix
```
