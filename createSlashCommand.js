require('dotenv').config();
const { Client, ClientApplication } = require("discord.js");

// pingコマンド
const ping = {
  name: "ping",
  description: "疎通確認です。",
};

// 言語リスト
// 25個までしか登録できないので、一部を削除
// full list: https://developers.deepl.com/docs/resources/supported-languages#target-languages
const LANGUAGES = {
  'AR': 'アラビア語',
  'DA': 'デンマーク語',
  'DE': 'ドイツ語',
  'EL': 'ギリシャ語',
  'EN-GB': '英語 (英国)',
  'ES': 'スペイン語',
  'FI': 'フィンランド語',
  'FR': 'フランス語',
  'HU': 'ハンガリー語',
  'ID': 'インドネシア語',
  'IT': 'イタリア語',
  'JA': '日本語',
  'KO': '韓国語',
  'LV': 'ラトビア語',
  'NB': 'ノルウェー語（ブークモール）',
  'NL': 'オランダ語',
  'PL': 'ポーランド語',
  'PT-BR': 'ポルトガル語（ブラジル）',
  'RO': 'ルーマニア語',
  'RU': 'ロシア語',
  'SK': 'スロバキア語',
  'SV': 'スウェーデン語',
  'TR': 'トルコ語',
  'UK': 'ウクライナ語',
  'ZH': '中国語（簡体字）'
};

// 言語リストからchange_languageコマンドの言語選択肢を作成
const languageChoices = Object.entries(LANGUAGES).map(([key, value]) => ({
  name: value,
  value: key
}));

// change_languageコマンド
const changeLang = {

  name: "change_language",
  description: "翻訳言語を変更します。引数なしで現在の設定を表示。",

  options: [
    {
      type: 3, // STRING
      name: "language",
      description: "どの言語に翻訳するか指定します。",
      choices: languageChoices,
    }
  ]
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
  const token = process.env.DISCORD_TOKEN_TEST;
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
