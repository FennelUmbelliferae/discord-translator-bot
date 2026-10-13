import { ApplicationCommandOptionType } from "discord.js";
import type { ApplicationCommandDataResolvable } from "discord.js";

import { LANGUAGES } from "./languages";

export const commands: ApplicationCommandDataResolvable[] = [
  { name: "ping", description: "疎通確認です。" },
  {
    name: "change_language",
    description: "翻訳言語を変更します。引数なしで現在の設定を表示。",
    options: Object.values(LANGUAGES).map((language) => ({
      type: ApplicationCommandOptionType.Boolean,
      name: language,
      description: `${language}に翻訳する場合trueを設定`,
    })),
  },
  { name: "get_deepl_limit", description: "DeepLのAPI使用量を確認します。" },
  {
    name: "skip_prefix",
    description: "翻訳をスキップするプレフィックスを設定します。引数なしで現在の設定を表示。",
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "prefix",
        description: "翻訳をスキップするプレフィックス記号（例: ;）",
        required: false,
      },
    ],
  },
];
