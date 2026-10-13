import { MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction, Message } from "discord.js";

import type { ConfigStore } from "./config";
import { getDeepLLimit, translateText } from "./deepl";
import { LANGUAGES_WITH_FLAGS, selectLanguages } from "./languages";
import { error, info } from "./logger";
import { escapeMarkdown, formatTranslationMessage, shouldSkipTranslation } from "./messages";

export async function onMessage(
  message: Message,
  store: ConfigStore,
  apiKey: string,
): Promise<void> {
  if (message.author.bot) return;
  const settings = store.read();
  if (shouldSkipTranslation(message.content, settings.skipTranslationPrefix)) {
    info(`Skipping translation for message: ${message.content}`);
    return;
  }

  try {
    const translations = await Promise.all(
      settings.selectedLanguages.map(async (language) => ({
        language,
        text: await translateText(apiKey, message.content, language),
      })),
    );
    const usage = await getDeepLLimit(apiKey);
    if (!message.channel.isSendable()) return;
    await message.channel.send({
      content: formatTranslationMessage(
        String(message.author),
        message.createdAt,
        translations,
        usage,
      ),
      allowedMentions: { repliedUser: false },
    });
  } catch (cause) {
    error("Translation error:", cause);
    if (message.channel.isSendable()) {
      await message.channel.send("申し訳ありません、翻訳中にエラーが発生しました。");
    }
  }
}

export async function onInteraction(
  interaction: ChatInputCommandInteraction,
  store: ConfigStore,
  apiKey: string,
): Promise<void> {
  switch (interaction.commandName) {
    case "ping": {
      const now = Date.now();
      const gatewayPing = interaction.client.ws.ping;
      await interaction.reply({
        content: `gateway: ${gatewayPing}ms`,
        flags: MessageFlags.Ephemeral,
      });
      await interaction.editReply(`gateway: ${gatewayPing}ms\n往復: ${Date.now() - now}ms`);
      break;
    }
    case "change_language": {
      const options = interaction.options.data;
      const settings = store.read();
      if (options.length === 0) {
        const currentLangs = settings.selectedLanguages
          .map((lang) => LANGUAGES_WITH_FLAGS[lang])
          .join(",\n");
        const availableLangs = Object.entries(LANGUAGES_WITH_FLAGS)
          .map(([code, name]) => `${code}: ${name}`)
          .join("\n");
        await interaction.reply({
          content: escapeMarkdown(
            ["現在の設定:", currentLangs, "", "利用可能な言語:", availableLangs].join("\n"),
          ),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const selectedLanguages = selectLanguages(options);
      store.write({ ...settings, selectedLanguages });
      await interaction.reply(
        [
          "言語を変更しました:",
          selectedLanguages.map((lang) => LANGUAGES_WITH_FLAGS[lang]).join(",\n"),
        ].join("\n"),
      );
      break;
    }
    case "get_deepl_limit": {
      const usage = await getDeepLLimit(apiKey);
      await interaction.reply(
        `DeepLのAPI使用量: ${usage.character_count} / ${usage.character_limit}`,
      );
      break;
    }
    case "skip_prefix": {
      const options = interaction.options.data;
      const settings = store.read();
      const prefix = settings.skipTranslationPrefix;
      if (options.length === 0) {
        await interaction.reply({
          content: `現在の翻訳スキッププレフィックス: \`${prefix}\`\n\n使い方: メッセージの先頭に \`${prefix}\` をつけると翻訳されません。`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const newPrefix = options.find((option) => option.name === "prefix")?.value;
      if (typeof newPrefix === "string" && newPrefix) {
        store.write({ ...settings, skipTranslationPrefix: newPrefix });
        await interaction.reply(`翻訳スキッププレフィックスを \`${newPrefix}\` に変更しました。`);
      } else {
        await interaction.reply({
          content:
            "エラー: 'prefix' オプションが見つかりませんでした。プレフィックスを指定してください。",
          flags: MessageFlags.Ephemeral,
        });
      }
      break;
    }
    default:
      // 登録が古いまま残ったコマンドは応答しないので、原因を追えるように名前を残す
      error(`Unknown command: ${interaction.commandName}`);
  }
}
