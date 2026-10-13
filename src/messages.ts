import type { DeepLUsage } from "./deepl";
import { FLAG_EMOJIS } from "./languages";
import type { LanguageCode } from "./languages";

export function shouldSkipTranslation(content: string, prefix: string): boolean {
  return content.startsWith(prefix);
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([\\_*|`~])/g, "\\$1");
}

export function formatTranslationMessage(
  sender: string,
  createdAt: Date,
  translations: readonly { language: LanguageCode; text: string }[],
  usage: DeepLUsage,
): string {
  return [
    `Sender: ${sender}`,
    `Sent Time: <t:${Math.round(createdAt.getTime() / 1000)}:f>`,
    "",
    translations
      .map(({ language, text }) => `${FLAG_EMOJIS[language]} ${language}: ${text}`)
      .join("\n\n"),
    "",
    `Translation Limit: ${usage.character_count} / ${usage.character_limit}`,
  ].join("\n");
}
