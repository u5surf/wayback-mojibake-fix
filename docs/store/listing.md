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

審査で必ず聞かれる項目。**審査担当は日本語話者とは限らないので英語で記入し、
必要なら日本語を併記する。**

ホスト権限を要求すると「詳しい審査が必要となり、公開が遅れる可能性があります」
という警告が出るが、これはホスト権限を持つ拡張すべてに出る定型文であって、
申請に問題があるという意味ではない。通常 1〜3 週間かかる。

通りやすくするために効くのは次の 3 点。

1. **ソースコードの URL を正当性の説明に書く。** 公開リポジトリなので審査担当が
   実物を読める。難読化していないことも確認できるため、これが最も効く。
2. **`<all_urls>` を使っていないことを明示する。** 単一ホストに限定した拡張は
   審査の分類上かなり軽い。
3. **説明と実装を一致させる。** 実際に触るのは `*://web.archive.org/web/*` だけ。

#### 単一用途 (Single purpose)

```
Wayback Machine 上の、文字コードが宣言されていないアーカイブページの
文字化けを修正して表示する。これ以外の機能は持たない。
```

#### activeTab が必要な理由

入力欄は 1000 文字以内。以下は英語 698 文字 / 日本語 278 文字。

```
This extension has a toolbar popup. When the user clicks the toolbar icon,
the popup needs to communicate with the tab the user is currently viewing in
order to (a) show which character encoding was detected for that page and
why, (b) apply a different encoding if the user chooses one manually from
the popup, and (c) turn the conversion off or back on for that page when
the user toggles it, so they can compare the result with the browser's
original rendering.

activeTab grants this access only for the tab the user explicitly interacted
with, and only at the moment of that interaction. The extension does not use
it to read tab contents in the background, and it never accesses any other
tab.
```

```
ツールバーのアイコンから開くポップアップが、現在表示中のタブと通信するために
使用します。用途は 3 つで、(a) そのページで判定された文字コードとその根拠を
表示すること、(b) 利用者がポップアップから別の文字コードを手動で選んだ場合に
それを適用すること、(c) 利用者がトグルを操作した場合に、そのページの変換を
解除・再適用して、ブラウザ本来の表示と見比べられるようにすることです。

利用者が明示的に操作したタブに対して、その操作の瞬間だけアクセスします。
バックグラウンドでタブの内容を読むことも、他のタブにアクセスすることも
ありません。
```

#### ホスト権限 (`*://web.archive.org/*`) が必要な理由

**「なぜ DOM では駄目なのか」を必ず書くこと。** これが無いと「ページを読むだけ
なら content script で足りるのでは」と見なされて質問が返ってくる。

入力欄は **1000 文字以内**。以下は 974 文字 (改行を 2 文字と数えられても 991)。
削るなら 1 段落目から削り、2 段落目の U+FFFD の説明は残すこと。そこが
ホスト権限を要求する理由そのもので、削ると審査が止まる。

```
This extension fixes garbled Japanese text on archived pages at
web.archive.org. Pages from around 2000 declare no character encoding, and
modern browsers no longer autodetect, so they are decoded with the wrong
codec and become unreadable.

Detecting the correct encoding requires the page's raw bytes, and the DOM
cannot provide them: by the time a document exists, the browser has already
decoded it with the wrong codec and replaced undecodable bytes with U+FFFD,
which is not reversible. The extension re-reads the same URL with
fetch(url, {cache: 'force-cache'}), normally served from the HTTP cache,
then detects the encoding and re-renders the document.

Both the content script and that fetch need host access to web.archive.org.
The permission is scoped to that single host; the extension never requests
<all_urls> or any other host, and never runs elsewhere. All processing is
local; no data is transmitted.

Source: https://github.com/u5surf/wayback-mojibake-fix
```

```
この拡張の唯一の機能は、web.archive.org が再生するアーカイブページの日本語の
文字化けを直すことです。2000 年前後に保存されたページは文字コードをどこにも
宣言しておらず、現代のブラウザは自動判別をやめたため、誤ったコーデックで
解釈されて読めなくなります。

正しい文字コードを判定するには、ページの生のバイト列を読む必要があります。
DOM は使えません。文書が生成された時点でブラウザは既に誤ったコーデックで
デコードを終えており、解釈できなかったバイトは U+FFFD に置換されていて、
元に戻せないからです。そのため同じ URL を fetch(url, {cache: 'force-cache'})
で読み直し (通常は HTTP キャッシュから返るため新たな通信は発生しません)、
そのバイト列から文字コードを判定して文書を描画し直します。

コンテンツスクリプトとこの fetch の両方に web.archive.org へのホスト権限が
必要です。権限はこの 1 ホストに限定しており、<all_urls> も他のホストも要求
せず、他のサイトでは一切動作しません。処理はすべてブラウザ内で完結し、
外部へのデータ送信はありません。

ソースコード: https://github.com/u5surf/wayback-mojibake-fix
```

#### リモートコードの使用

**いいえ。** すべてのコードが拡張のパッケージに同梱されている。

#### データの取り扱い

以下 9 項目すべて「収集しない」で申告する。

```
個人を特定できる情報 / 健康情報 / 金融情報および支払い情報 / 認証情報 /
個人的な通信内容 / 位置情報 / ウェブ履歴 / ユーザー行動 /
ウェブサイトのコンテンツ

いずれも収集しない。拡張はいかなるデータも外部へ送信しない。
文字コードの判定はすべて利用者のブラウザ内で完結する。
```

あわせて 3 つの宣言にチェックする。

- データを承認された用途以外に使用しない
- データを第三者に販売しない
- データを信用調査や融資目的に使用しない

### 公開を自動化する

`.github/workflows/publish.yml` が zip をアップロードして審査に提出する。
**タグ push では動かない。** Actions タブから、対象のタグを選んで手で実行する
(`Run workflow` の Branch/Tag でタグを選ぶ。ブランチのまま実行するとエラーで
止まる)。

`v*` のタグ push で走るのは `.github/workflows/release.yml` の方で、そちらは
GitHub Release に `wayback-mojibake-fix-<version>.zip` を添付するだけ。ストアには
何も送らない。

**初回だけは手作業。** Chrome Web Store の API は既存アイテムの更新しかできない。
アイテムの作成・掲載情報・スクリーンショット・権限の正当性説明 (このファイルの
内容) は、最初にダッシュボードへ手で登録する。$5 の登録料もそこで払う。

#### 必要な secret

リポジトリの `Settings → Secrets and variables → Actions` に 3 つ登録する。

| secret | 取得元 |
| --- | --- |
| `CWS_EXTENSION_ID` | 公開後のアイテム URL に含まれる 32 文字 |
| `CWS_CLIENT_ID` | Google Cloud の OAuth クライアント (デスクトップアプリ) |
| `CWS_REFRESH_TOKEN` | `refresh-token.sh` で 1 度だけ取得 |

**クライアント シークレットは要らない。** デスクトップアプリの OAuth クライアントは
公開クライアント扱いで、Google は使えるシークレットを発行しない (作成ダイアログにも
出てこない)。トークン交換は代わりに PKCE の `code_verifier` で認証し、refresh 時は
`client_id` と `refresh_token` だけを送る。

#### refresh token の取り方

1. Google Cloud でプロジェクトを作り、**Chrome Web Store API** を有効化する
2. OAuth 同意画面を作る
   - ユーザーの種類は**外部** (内部は Workspace 組織のアカウントでしか選べない)
   - アプリ名・サポートメール・連絡先だけ埋める。ロゴとドメインは**空のまま**に
     する。埋めるとブランド確認が要る
   - スコープは**追加しない**。認可 URL の `scope=` で直接指定する
   - **テストユーザーに自分のアカウントを追加する**
   - **公開ステータスを「本番」にする。**「テスト」のままで発行した refresh
     token は **7 日で失効**し、CI が 1 週間で壊れる。`chromewebstore` スコープは
     機微でも制限付きでもないので、本番にしても Google の審査は要らない
3. 「クライアント」→「クライアントを作成」→ **デスクトップアプリ**を作り、
   クライアント ID を控える (シークレットは発行されない)
4. `refresh-token.sh` を実行し、表示される指示に従う

   ```console
   $ docs/store/refresh-token.sh <CLIENT_ID>
   ```

   PKCE の code_verifier / code_challenge の生成、認可 URL の組み立て、
   認可コードの交換までをまとめてある。手でやると `access_type=offline` の
   付け忘れ (これが無いと refresh token が返らない) や、verifier と challenge
   の対応ずれで詰まりやすい。

認可画面では「このアプリは Google で確認されていません」と警告が出る。自分で
作ったアプリなので正常。「詳細」→「(アプリ名) に移動」で進む。

承認後、ブラウザは `http://localhost:8080/?code=...` への接続に失敗する。待ち受け
が無いので正常で、要るのはアドレスバーの `code=` の値。

`redirect_uri` に `urn:ietf:wg:oauth:2.0:oob` は使えない。Google が 2022 年に
廃止しており、いま作成したクライアントでは拒否される。デスクトップアプリ型の
クライアントはループバック (`http://localhost:<port>`) を事前登録なしで使える。

refresh token が失効したらワークフローは「アクセストークンを取得できなかった」
で止まる。手順 4〜5 をやり直して secret を入れ替える。公開ステータスが「本番」に
なっていれば、通常これは起きない。

#### リリース手順

1. `manifest.json` の `version` を上げる
2. `git tag v0.1.1 && git push origin v0.1.1`

タグと `manifest.json` のバージョンが食い違っていると、ワークフローが最初の
ステップで止まる。Chrome Web Store は同じバージョンを受け付けず、そのエラーは
読みにくいので手前で弾いている。

**公開は即時ではない。** API の publish は「審査に提出」までで、ホスト権限を持つ
この拡張は通常 1〜3 週間かかる。

タグ push の前に人間の承認を挟みたくなったら、ジョブに
`environment: chrome-web-store` を足して、その environment に必須レビュアーを
設定する。

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
