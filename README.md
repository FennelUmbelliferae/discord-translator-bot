# Discord Translator Bot

この Discord Bot は、DeepL API を使用して Discord サーバー内のメッセージを複数の言語に自動翻訳する。

## 機能

- メッセージの自動翻訳
- 複数言語への同時翻訳
- スラッシュコマンドを使用した翻訳言語の動的変更
- 翻訳をスキップするプレフィックス設定
- DeepL API使用量の確認

## セットアップ

### Bun での起動

mise をインストールした環境でリポジトリを取得し、`mise.toml` が指定する版の Bun と依存関係を準備する。

```sh
git clone https://github.com/FennelUmbelliferae/discord-translator-bot.git
cd discord-translator-bot
mise trust
mise install
mise run setup
```

生成された `.env` に Discord トークンと DeepL API Free のキーを設定する。
Discord Developer Portal で Message Content Intent を有効にし、`bot` と `applications.commands` のスコープでボットを招待する。
対象チャンネルには閲覧とメッセージ送信の権限が必要である。

| 環境変数 | 内容 |
| --- | --- |
| `DISCORD_TOKEN` | `NODE_ENV=production` で使う Discord トークン |
| `DISCORD_TOKEN_TEST` | `NODE_ENV` が production 以外のときに使う Discord トークン |
| `DEEPL_API_KEY` | DeepL API Free の認証キー（必須） |
| `NODE_ENV` | `.env.example` では production |
| `PORT` | ヘルスチェックのポート（既定値 3000） |
| `CONFIG_PATH` | 設定ファイルの保存先（既定値 `data/config.json`） |

コマンド登録は起動とは別に実行する。
初回とコマンド定義を変更したときに、起動時と同じ環境変数でグローバル登録する。

```sh
bun run register
bun start
```

開発時は `bun run dev`、検証は `bun run check` を使う。
Bun が `.env` を読み込むため、dotenv は不要である。

### Docker での起動

`.env` を設定したうえでイメージをビルドし、設定の保存先 `/app/data` に永続ボリュームをマウントする。
ホストのディレクトリをバインドマウントする場合は、コンテナの `bun` ユーザーが書けるように所有者を 1000:1000 にする。

```sh
docker build -t discord-translator-bot .
docker run --rm --env-file .env -p 3000:3000 -v translator-data:/app/data discord-translator-bot
```

コンテナでコマンド登録する場合は `docker run --rm --env-file .env discord-translator-bot bun run src/registerCommands.ts` を実行する。
`/health` は HTTP 200 と `OK`、それ以外は 404 を返す。
SIGINT と SIGTERM を受けると Discord 接続と HTTP サーバーを終了する。

### 設定の保存と配布イメージ

設定ファイルがない場合は、日本語と韓国語、スキッププレフィックス `;` を使う。
設定変更コマンドを受けたときに、親ディレクトリと設定ファイルを作成する。
不正なファイルはログに記録して既定値に戻り、設定変更コマンドを受けるまで元のファイルを保持する。
旧版の設定を引き継ぐ場合は、起動前に旧 `config/config.json` を `CONFIG_PATH` の保存先へコピーする。

GitHub Release の公開時と手動実行時に、`ghcr.io/fennelumbelliferae/discord-translator-bot` へイメージを配布する。
Release のタグは先頭の `v` を含めてそのまま使い、完全なコミット SHA でもタグを付ける。
手動実行では完全なコミット SHA のタグだけを付ける。

## 使用方法

### スラッシュコマンド

ボットは以下のスラッシュコマンドをサポートしています：

1. `/ping`: ボットの応答時間を確認します。

2. `/change_language`: 翻訳言語を変更します。
   - 引数なしで実行すると、現在の設定と利用可能な言語のリストを表示します。
   - 言語を選択するには、各言語オプションに対して `true` または `false` を設定します。

   例：

   ``` sh
   /change_language 日本語:true 韓国語:true 英語_英国:true
   ```

3. `/get_deepl_limit`: DeepL APIの使用量を確認します。

4. `/skip_prefix`: 翻訳をスキップするためのプレフィックスを設定します。
   - 引数なしで実行すると、現在の設定を表示します。
   - プレフィックスを変更するには、`prefix`パラメータに新しい値を設定します。

   例：

   ``` sh
   /skip_prefix prefix:;
   ```

### 自動翻訳

設定された言語に基づいて、ボットは自動的にチャンネル内のメッセージを翻訳します。
翻訳されたメッセージは元のメッセージの直後に表示されます。

### 翻訳のスキップ

特定のメッセージを翻訳したくない場合は、メッセージの先頭に設定されたプレフィックス（デフォルトは`;`）を付けます。
例：

```text
;このメッセージは翻訳されません
```

プレフィックスは `/skip_prefix` コマンドで変更できます。

## 利用可能な言語

ボットは以下の言語をサポートしています：

- アラビア語
- デンマーク語
- ドイツ語
- ギリシャ語
- 英語（イギリス）
- スペイン語
- フィンランド語
- フランス語
- ハンガリー語
- インドネシア語
- イタリア語
- 日本語
- 韓国語
- ラトビア語
- ノルウェー語（ブークモール）
- オランダ語
- ポーランド語
- ポルトガル語（ブラジル）
- ルーマニア語
- ロシア語
- スロバキア語
- スウェーデン語
- トルコ語
- ウクライナ語
- 中国語（簡体字）

正確な言語オプションとその表記については、`/change_language`コマンドを引数なしで実行して確認してください。

## 貢献

問題を発見した場合や機能の提案がある場合は、Issueを作成するかプルリクエストを送信してください。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されている。
詳細は [LICENSE](LICENSE) を参照する。
