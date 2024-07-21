const { Client, ClientApplication } = require("discord.js");

// 環境変数からトークンを取得
client.token = process.env.DISCORD_TOKEN_TEST;

// pingコマンド
const ping = {
  name: "ping",
  description: "疎通確認です。",
};

// 言語リスト
const LANGUAGES = {
  'AR': 'アラビア語',
  'BG': 'ブルガリア語',
  'CS': 'チェコ語',
  'DA': 'デンマーク語',
  'DE': 'ドイツ語',
  'EL': 'ギリシャ語',
  'EN-GB': '英語 (英国)',
  'EN-US': '英語 (米国)',
  'ES': 'スペイン語',
  'ET': 'エストニア語',
  'FI': 'フィンランド語',
  'FR': 'フランス語',
  'HU': 'ハンガリー語',
  'ID': 'インドネシア語',
  'IT': 'イタリア語',
  'JA': '日本語',
  'KO': '韓国語',
  'LT': 'リトアニア語',
  'LV': 'ラトビア語',
  'NB': 'ノルウェー語（ブークモール）',
  'NL': 'オランダ語',
  'PL': 'ポーランド語',
  'PT-BR': 'ポルトガル語（ブラジル）',
  'PT-PT': 'ポルトガル語（ブラジル以外）',
  'RO': 'ルーマニア語',
  'RU': 'ロシア語',
  'SK': 'スロバキア語',
  'SL': 'スロベニア語',
  'SV': 'スウェーデン語',
  'TR': 'トルコ語',
  'UK': 'ウクライナ語',
  'ZH': '中国語（簡体字）'
};

// 言語リストからchangeLanguageコマンドの言語選択肢を作成
const languageChoices = Object.entries(LANGUAGES).map(([key, value]) => ({
  name: value,
  value: key
}));

// changeLanguageコマンド
const changeLang = {

  name: "changeLanguage",
  description: "翻訳言語を変更します。",

  options: [
    {
      type: "STRING",
      name: "language",
      description: "どの言語に翻訳するか指定します。",
      required: true,
      choices: languageChoices,
    }
  ]
};

// getDeepLLimitコマンド
const getDeepLLimit = {
  name: "getDeepLLimit",
  description: "DeepLのAPI使用量を確認します。",
};

// コマンドリスト
const commands = [ping, changeLang, getDeepLLimit];

// クライアントのインスタンスを生成
const client = new Client({
  intents: 0,
});

// コマンドを登録する関数
async function register(client, commands, guildID) {

  if (guildID == null) return client.application.commands.set(commands);

  return client.application.commands.set(commands, guildID);

}

// メイン処理
async function main() {

  client.application = new ClientApplication(client, {});
  await client.application.fetch();

  // コマンドを登録
  await register(client, commands, process.argv[2]);
  console.log("registration succeed!");

}

// メイン処理を実行
main().catch(err => console.error(err));
