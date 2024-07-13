require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
  ],
});

const LANGUAGES = {
  'BG': '🇧🇬 ブルガリア語', 'CS': '🇨🇿 チェコ語', 'DA': '🇩🇰 デンマーク語',
  'DE': '🇩🇪 ドイツ語', 'EL': '🇬🇷 ギリシャ語', 'EN': '🇬🇧 英語',
  'ES': '🇪🇸 スペイン語', 'ET': '🇪🇪 エストニア語', 'FI': '🇫🇮 フィンランド語',
  'FR': '🇫🇷 フランス語', 'HU': '🇭🇺 ハンガリー語', 'ID': '🇮🇩 インドネシア語',
  'IT': '🇮🇹 イタリア語', 'JA': '🇯🇵 日本語', 'KO': '🇰🇷 韓国語',
  'LT': '🇱🇹 リトアニア語', 'LV': '🇱🇻 ラトビア語', 'NB': '🇳🇴 ノルウェー語',
  'NL': '🇳🇱 オランダ語', 'PL': '🇵🇱 ポーランド語', 'PT': '🇵🇹 ポルトガル語',
  'RO': '🇷🇴 ルーマニア語', 'RU': '🇷🇺 ロシア語', 'SK': '🇸🇰 スロバキア語',
  'SL': '🇸🇮 スロベニア語', 'SV': '🇸🇪 スウェーデン語', 'TR': '🇹🇷 トルコ語',
  'UK': '🇺🇦 ウクライナ語', 'ZH': '🇨🇳 中国語'
};

let selectedLanguages = ['JA', 'KO'];

const getDeepLLimit = async () => {

  const response = await axios.post(
    'https://api-free.deepl.com/v2/usage',

    new URLSearchParams({
      auth_key: process.env.DEEPL_API_KEY,
    }),

    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  if (message.content.startsWith('!translate')) {

    const args = message.content.split(' ').slice(1);
    if (args.length === 0) {
      const currentLangs = selectedLanguages.map(lang => LANGUAGES[lang]).join(', ');
      const availableLangs = Object.entries(LANGUAGES).map(([code, name]) => `${code}: ${name}`).join('\n');
      await message.channel.send(`現在の翻訳言語: ${currentLangs}\n\n言語を変更するには: !translate [言語コード] [言語コード] ...\n\n利用可能な言語コード:\n${availableLangs}`);
      return;
    }

    const validLanguages = args.filter(lang => LANGUAGES.hasOwnProperty(lang.toUpperCase()));
    if (validLanguages.length > 0) {
      selectedLanguages = validLanguages.map(lang => lang.toUpperCase());
      const newLangs = selectedLanguages.map(lang => LANGUAGES[lang]).join(', ');
      await message.channel.send(`翻訳言語を以下に設定しました: ${newLangs}`);
    } else {
      await message.channel.send('有効な言語コードが指定されていません。');
    }

    return;
  }

  try {

    const translations = await Promise.all(
      selectedLanguages.map(async (lang) => {
        const response = await axios.post(
          'https://api-free.deepl.com/v2/translate',
          new URLSearchParams({
            auth_key: process.env.DEEPL_API_KEY,
            text: message.content,
            target_lang: lang,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        return `${LANGUAGES[lang].split(' ')[0]} ${lang}: ${response.data.translations[0].text}`;
      })
    );

    const deepLLimit = await getDeepLLimit();
    const timestamp = "<t:" + String(Math.round(message.createdAt.getTime() / 1000)) + ":f>";
    const translatedMessage =
      `Sender: ${message.author}\n` +
      `Sent Time: ${timestamp}\n` +
      `\n` +
      `${translations.join('\n\n')}\n` +
      `\n` +
      `Translation Limit: ${deepLLimit.character_count} / ${deepLLimit.character_limit}`;

    const options = {
      content: translatedMessage,
      allowedMentions: { repliedUser: false },
    }

    await message.channel.send(options);

  } catch (error) {

    console.error('Translation error:', error);
    await message.channel.send('申し訳ありません、翻訳中にエラーが発生しました。');
  }

});

client.login(process.env.DISCORD_TOKEN);
