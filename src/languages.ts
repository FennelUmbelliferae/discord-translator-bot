// スラッシュコマンドの候補には25個までしか登録できないので、一部を削除
// full list: https://developers.deepl.com/docs/resources/supported-languages#target-languages
export const LANGUAGES = {
  AR: "アラビア語",
  DA: "デンマーク語",
  DE: "ドイツ語",
  EL: "ギリシャ語",
  "EN-GB": "英語_英国",
  ES: "スペイン語",
  FI: "フィンランド語",
  FR: "フランス語",
  HU: "ハンガリー語",
  ID: "インドネシア語",
  IT: "イタリア語",
  JA: "日本語",
  KO: "韓国語",
  LV: "ラトビア語",
  NB: "ノルウェー語_ブークモール",
  NL: "オランダ語",
  PL: "ポーランド語",
  "PT-BR": "ポルトガル語_ブラジル",
  RO: "ルーマニア語",
  RU: "ロシア語",
  SK: "スロバキア語",
  SV: "スウェーデン語",
  TR: "トルコ語",
  UK: "ウクライナ語",
  ZH: "中国語_簡体字",
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const FLAG_EMOJIS: Record<LanguageCode, string> = {
  AR: "🇸🇦",
  DA: "🇩🇰",
  DE: "🇩🇪",
  EL: "🇬🇷",
  "EN-GB": "🇬🇧",
  ES: "🇪🇸",
  FI: "🇫🇮",
  FR: "🇫🇷",
  HU: "🇭🇺",
  ID: "🇮🇩",
  IT: "🇮🇹",
  JA: "🇯🇵",
  KO: "🇰🇷",
  LV: "🇱🇻",
  NB: "🇳🇴",
  NL: "🇳🇱",
  PL: "🇵🇱",
  "PT-BR": "🇧🇷",
  RO: "🇷🇴",
  RU: "🇷🇺",
  SK: "🇸🇰",
  SV: "🇸🇪",
  TR: "🇹🇷",
  UK: "🇺🇦",
  ZH: "🇨🇳",
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export const LANGUAGES_WITH_FLAGS = Object.fromEntries(
  LANGUAGE_CODES.map((code) => [code, `${FLAG_EMOJIS[code]} ${LANGUAGES[code]}`]),
) as Record<LanguageCode, string>;

export function selectLanguages(
  options: readonly { name: string; value?: string | number | boolean }[],
): LanguageCode[] {
  return options
    .filter((option) => option.value)
    .map((option) => {
      const code = LANGUAGE_CODES.find((candidate) => LANGUAGES[candidate] === option.name);
      if (!code) throw new Error(`Unknown language option: ${option.name}`);
      return code;
    });
}
