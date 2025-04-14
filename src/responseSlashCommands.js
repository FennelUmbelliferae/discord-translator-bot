import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { LANGUAGES, LANGUAGES_WITH_FLAGS } from './consts.js';
import { escapeMarkdown } from './utils.js';
dotenv.config()

const CONFIG_FILE_PATH = './config/config.json';

const getConfig = () => {
  return JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf8'));
};

const setConfig = (config) => {
  writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
};

let config = getConfig();
let selectedLanguages = config.selectedLanguages || ['JA', 'KO'];
let skipTranslationPrefix = config.skipTranslationPrefix || ';';

async function getDeepLLimit() {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.post(
      'https://api-free.deepl.com/v2/usage',
      new URLSearchParams({ auth_key: process.env.DEEPL_API_KEY }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
  } catch (error) {
    console.error('DeepL API error:', error);
    return { character_count: 'ERROR', character_limit: 'ERROR' };
  }
}

// それぞれのコマンドの処理を定義
const commands = {
  /**
    *
    * @param {CommandInteraction} interaction
    * @returns
  */

  async ping(interaction) {
    const now = Date.now();
    const msg = [
      `gateway: ${await interaction.client.ws.ping}ms`,
    ];

    await interaction.reply({ content: msg.join("\n"), ephemeral: true });
    return await interaction.editReply([...msg, `往復: ${Date.now() - now}ms`].join("\n"));
  },

  async change_language(interaction) {
    const options = interaction.options.data;

    if (options.length === 0) {
      const currentLangs = selectedLanguages.map(lang => LANGUAGES_WITH_FLAGS[lang]).join(',\n');
      const availableLangs = Object.entries(LANGUAGES_WITH_FLAGS).map(([code, name]) => `${code}: ${name}`).join('\n');

      return await interaction.reply({
        content: escapeMarkdown([
          `現在の設定: ${currentLangs}`,
          "",
          `利用可能な言語:`,
          `${availableLangs}`,
        ].join('\n')),
        ephemeral: true,
      });
    }

    const optionsLangsInJA = options.filter(option => option.value).map(option => option.name);

    selectedLanguages = optionsLangsInJA.map(lang => {
      // LANGUAGESオブジェクトのエントリを探し、値が一致するキーを返す
      return Object.keys(LANGUAGES).find(key => LANGUAGES[key] === lang);
    });

    config.selectedLanguages = selectedLanguages;
    setConfig(config);

    return await interaction.reply(`言語を変更しました: ${selectedLanguages.map(lang => LANGUAGES_WITH_FLAGS[lang]).join(',\n')}`);
  },

  async get_deepl_limit(interaction) {
    const deepLLimit = await getDeepLLimit();
    return await interaction.reply(`DeepLのAPI使用量: ${deepLLimit.character_count} / ${deepLLimit.character_limit}`);
  },

  async skip_prefix(interaction) {
    const options = interaction.options.data;

    if (options.length === 0) {
      return await interaction.reply({
        content: `現在の翻訳スキッププレフィックス: \`${skipTranslationPrefix}\`\n\n使い方: メッセージの先頭に \`${skipTranslationPrefix}\` をつけると翻訳されません。`,
        ephemeral: true
      });
    }

    const newPrefix = options.find(option => option.name === 'prefix')?.value;
    if (newPrefix) {
      skipTranslationPrefix = newPrefix;
      config.skipTranslationPrefix = newPrefix;
      setConfig(config);
      return await interaction.reply(`翻訳スキッププレフィックスを \`${newPrefix}\` に変更しました。`);
    } else {
      // Handle case when prefix option is missing
      return await interaction.reply({
        content: `エラー: 'prefix' オプションが見つかりませんでした。プレフィックスを指定してください。`,
        ephemeral: true
      });
    }
  }
};

async function onInteraction(interaction) {
  if (!interaction.isCommand()) return;
  return commands[interaction.commandName](interaction);
}

export { onInteraction, getDeepLLimit };

