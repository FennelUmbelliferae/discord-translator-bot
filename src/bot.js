﻿import axios from 'axios';
import { Client, GatewayIntentBits, escapeMarkdown } from 'discord.js';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import http from 'http';
import { LANGUAGES, LANGUAGES_WITH_FLAGS } from './consts.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CONFIG_FILE_PATH = './config/config.json';

const getConfig = () => {
  return JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf8'));
};

const setConfig = (config) => {
  writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
};

let config = getConfig();
let selectedLanguages = config.selectedLanguages;

const getDeepLLimit = async () => {
  const response = await axios.post(
    'https://api-free.deepl.com/v2/usage',
    new URLSearchParams({ auth_key: process.env.DEEPL_API_KEY }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data;
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

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
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return `${LANGUAGES_WITH_FLAGS[lang].split(' ')[0]} ${lang}: ${response.data.translations[0].text}`;
      })
    );

    const deepLLimit = await getDeepLLimit();
    const timestamp = `<t:${Math.round(message.createdAt.getTime() / 1000)}:f>`;
    const translatedMessage = [
      `Sender: ${message.author}`,
      `Sent Time: ${timestamp}`,
      '',
      translations.join('\n\n'),
      '',
      `Translation Limit: ${deepLLimit.character_count} / ${deepLLimit.character_limit}`
    ].join('\n');

    await message.channel.send({ content: translatedMessage, allowedMentions: { repliedUser: false } });
  } catch (error) {
    console.error('Translation error:', error);
    await message.channel.send('申し訳ありません、翻訳中にエラーが発生しました。');
  }
});

const commands = {
  async ping(interaction) {
    const now = Date.now();
    const gatewayPing = await interaction.client.ws.ping;
    await interaction.reply({ content: `gateway: ${gatewayPing}ms`, ephemeral: true });
    await interaction.editReply(`gateway: ${gatewayPing}ms\n往復: ${Date.now() - now}ms`);
  },

  async change_language(interaction) {
    const options = interaction.options.data;

    if (options.length === 0) {
      const currentLangs = selectedLanguages.map(lang => LANGUAGES_WITH_FLAGS[lang]).join(',\n');
      const availableLangs = Object.entries(LANGUAGES_WITH_FLAGS).map(([code, name]) => `${code}: ${name}`).join('\n');

      return await interaction.reply({
        content: escapeMarkdown([
          '現在の設定:',
          currentLangs,
          '',
          '利用可能な言語:',
          availableLangs,
        ].join('\n')),
        ephemeral: true,
      });
    }

    const optionsLangsInJA = options.filter(option => option.value).map(option => option.name);
    selectedLanguages = optionsLangsInJA.map(lang => {
      return Object.keys(LANGUAGES).find(key => LANGUAGES[key] === lang);
    });

    config.selectedLanguages = selectedLanguages;
    setConfig(config);

    await interaction.reply([
      '言語を変更しました:',
      selectedLanguages.map(lang => LANGUAGES_WITH_FLAGS[lang]).join(',\n')
    ].join('\n'));
  },

  async get_deepl_limit(interaction) {
    const deepLLimit = await getDeepLLimit();
    await interaction.reply(`DeepLのAPI使用量: ${deepLLimit.character_count} / ${deepLLimit.character_limit}`);
  },
};

client.on('interactionCreate', (interaction) => {
  if (interaction.isChatInputCommand()) {
    commands[interaction.commandName](interaction).catch(err => console.error(err));
  }
});

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

const DISCORD_TOKEN = process.env.NODE_ENV === 'production' ? process.env.DISCORD_TOKEN : process.env.DISCORD_TOKEN_TEST;
client.login(DISCORD_TOKEN);

process.on('SIGINT', async () => {
  console.log('Caught interrupt signal');
  await client.destroy();
  server.close();
  process.exit(0);
});
