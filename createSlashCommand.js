import { Client } from 'discord.js';
import * as dotenv from 'dotenv';
import { LANGUAGES } from './consts.js';
dotenv.config()

// pingコマンド
const ping = {
  name: "ping",
  description: "疎通確認です。",
};

// 言語リストからchange_languageコマンドの言語選択肢を作成
const langOptions = Object.values(LANGUAGES).map(language => ({
  type: 5, // BOOLEAN
  name: language,
  description: `${language}に翻訳する場合trueを設定`
}));

// change_languageコマンド
const changeLang = {

  name: "change_language",
  description: "翻訳言語を変更します。引数なしで現在の設定を表示。",
  options: langOptions

};

// get_deepl_limitコマンド
const getDeepLLimit = {
  name: "get_deepl_limit",
  description: "DeepLのAPI使用量を確認します。",
};

// コマンドリスト
const commands = [ping, changeLang, getDeepLLimit];

// コマンドを登録する関数
async function register(client, commands, guildID) {

  if (guildID == null) return client.application.commands.set(commands);

  return client.application.commands.set(commands, guildID);

}

// メイン処理
async function main() {

  // クライアントのインスタンスを生成
  const client = new Client({
    intents: 0,
  });

  // 環境変数からトークンを取得し、クライアントにログイン
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // クライアントが準備完了するのを待つ
  client.once('ready', async () => {

    console.log(`Logged in as ${client.user.tag}!`);

    // コマンドを登録
    await register(client, commands, null);
    console.log("registration succeed!");

    client.destroy();

  });

}

// メイン処理を実行
main().catch(err => console.error(err));
