// Description: Consts used in the application

// 言語リスト
// スラッシュコマンドの候補には25個までしか登録できないので、一部を削除
// full list: https://developers.deepl.com/docs/resources/supported-languages#target-languages
const LANGUAGES = {
  'AR': 'アラビア語',
  'DA': 'デンマーク語',
  'DE': 'ドイツ語',
  'EL': 'ギリシャ語',
  'EN-GB': '英語_英国',
  'ES': 'スペイン語',
  'FI': 'フィンランド語',
  'FR': 'フランス語',
  'HU': 'ハンガリー語',
  'ID': 'インドネシア語',
  'IT': 'イタリア語',
  'JA': '日本語',
  'KO': '韓国語',
  'LV': 'ラトビア語',
  'NB': 'ノルウェー語_ブークモール',
  'NL': 'オランダ語',
  'PL': 'ポーランド語',
  'PT-BR': 'ポルトガル語_ブラジル',
  'RO': 'ルーマニア語',
  'RU': 'ロシア語',
  'SK': 'スロバキア語',
  'SV': 'スウェーデン語',
  'TR': 'トルコ語',
  'UK': 'ウクライナ語',
  'ZH': '中国語_簡体字'
};

// 国コードと国旗絵文字の対応
const FLAG_EMOJIS = {
  'AR': '🇸🇦',
  'DA': '🇩🇰',
  'DE': '🇩🇪',
  'EL': '🇬🇷',
  'EN-GB': '🇬🇧',
  'ES': '🇪🇸',
  'FI': '🇫🇮',
  'FR': '🇫🇷',
  'HU': '🇭🇺',
  'ID': '🇮🇩',
  'IT': '🇮🇹',
  'JA': '🇯🇵',
  'KO': '🇰🇷',
  'LV': '🇱🇻',
  'NB': '🇳🇴',
  'NL': '🇳🇱',
  'PL': '🇵🇱',
  'PT-BR': '🇧🇷',
  'RO': '🇷🇴',
  'RU': '🇷🇺',
  'SK': '🇸🇰',
  'SV': '🇸🇪',
  'TR': '🇹🇷',
  'UK': '🇺🇦',
  'ZH': '🇨🇳'
};

const LANGUAGES_WITH_FLAGS = Object.fromEntries(
  Object.entries(LANGUAGES).map(([code, language]) => {
    const flagEmoji = FLAG_EMOJIS[code] || '';
    return [code, `${flagEmoji} ${language}`];
  })
);

export { FLAG_EMOJIS, LANGUAGES, LANGUAGES_WITH_FLAGS };

