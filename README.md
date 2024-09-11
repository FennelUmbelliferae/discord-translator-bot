# Discord Translator Bot

このDiscord Botは、DeepL APIを使用してDiscordサーバー内のメッセージを複数の言語に自動的に翻訳するボットです。

## 機能

- メッセージの自動翻訳
- 複数言語への同時翻訳
- スラッシュコマンドを使用した翻訳言語の動的変更
- DeepL API使用量の確認

## セットアップ

### 通常のセットアップ

1. リポジトリをクローン：

   ``` sh
   git clone https://github.com/yourusername/discord-translator-bot.git
   cd discord-translator-bot
   ```

2. 必要な依存関係をインストール：

   ``` sh
   npm install
   ```

3. `.env.example`ファイルを`.env`にリネームし、必要な環境変数を設定：

   ``` sh
   DISCORD_TOKEN=your_discord_token_here
   DEEPL_API_KEY=your_deepl_api_key_here
   DISCORD_TOKEN_TEST=your_test_discord_token_here
   NODE_ENV=production
   ```

4. ボットを起動：

   ``` sh
   npm start
   ```

### Dockerを使用したセットアップ

1. リポジトリをクローン：

   ``` sh
   git clone https://github.com/yourusername/discord-translator-bot.git
   cd discord-translator-bot
   ```

2. `.env`ファイルを作成し、必要な環境変数を設定（上記の通常のセットアップの手順3を参照）。

3. Dockerイメージをビルド：

   ``` sh
   docker build -t discord-translator-bot .
   ```

4. コンテナを実行：

   ``` sh
   docker run --env-file .env discord-translator-bot
   ```

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

### 自動翻訳

設定された言語に基づいて、ボットは自動的にチャンネル内のメッセージを翻訳します。翻訳されたメッセージは元のメッセージの直後に表示されます。

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

このプロジェクトはMITライセンスの下で公開されています。詳細については[LICENSE](https://github.com/FennelUmbelliferae/discord-translator-bot/blob/95c5c311d5ae6ea4b0bb553a7a86843527522122/LICENSE)ファイルを参照してください。
