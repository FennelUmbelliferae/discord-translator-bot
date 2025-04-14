import * as dotenv from 'dotenv';
import { LANGUAGES } from './consts.js';
dotenv.config()

let selectedLanguages = ['JA', 'KO'];

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

    console.log(interaction.options.data);
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

    return await interaction.reply(`言語を変更しました: ${selectedLanguages.map(lang => LANGUAGES_WITH_FLAGS[lang]).join(',\n')}`);
  },

  async get_deepl_limit(interaction) {
    const deepLLimit = await getDeepLLimit();
    return await interaction.reply(`DeepLのAPI使用量: ${deepLLimit.character_count} / ${deepLLimit.character_limit}`);
  },
};

async function onInteraction(interaction) {

  if (!interaction.isCommand()) return;
  return commands[interaction.commandName](interaction);

}

