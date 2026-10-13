import { describe, expect, test } from "bun:test";

import { LANGUAGE_CODES, LANGUAGES, selectLanguages } from "../src/languages";
import { escapeMarkdown, formatTranslationMessage, shouldSkipTranslation } from "../src/messages";

describe("language selection", () => {
  test("maps all 25 command option names to their language codes", () => {
    expect(LANGUAGE_CODES).toHaveLength(25);
    expect(
      selectLanguages(Object.values(LANGUAGES).map((name) => ({ name, value: true }))),
    ).toEqual(LANGUAGE_CODES);
  });
  test("keeps supplied order and selects only true options", () => {
    expect(
      selectLanguages([
        { name: "英語_英国", value: true },
        { name: "日本語", value: false },
        { name: "韓国語", value: true },
        { name: "フランス語" },
      ]),
    ).toEqual(["EN-GB", "KO"]);
    expect(selectLanguages([{ name: "日本語", value: false }])).toEqual([]);
  });
});

test("translation formatting preserves sender, rounded time, flags, spacing and usage", () => {
  expect(
    formatTranslationMessage(
      "<@123>",
      new Date(1700000000600),
      [
        { language: "JA", text: "こんにちは" },
        { language: "KO", text: "안녕하세요" },
      ],
      { character_count: 12, character_limit: 500000 },
    ),
  ).toBe(
    "Sender: <@123>\nSent Time: <t:1700000001:f>\n\n🇯🇵 JA: こんにちは\n\n🇰🇷 KO: 안녕하세요\n\nTranslation Limit: 12 / 500000",
  );
});

test("formatting an empty language selection still includes sender, time and usage", () => {
  expect(
    formatTranslationMessage("<@123>", new Date(0), [], {
      character_count: 0,
      character_limit: 500000,
    }),
  ).toBe("Sender: <@123>\nSent Time: <t:0:f>\n\n\n\nTranslation Limit: 0 / 500000");
});

test("skip-prefix detection checks only the beginning and supports multi-character prefixes", () => {
  expect(shouldSkipTranslation(";hello", ";")).toBe(true);
  expect(shouldSkipTranslation("hello;", ";")).toBe(false);
  expect(shouldSkipTranslation(" ;hello", ";")).toBe(false);
  expect(shouldSkipTranslation("//hello", "//")).toBe(true);
  expect(shouldSkipTranslation("/hello", "//")).toBe(false);
  expect(shouldSkipTranslation("anything", "")).toBe(true);
});

test("escapes the same Markdown characters in the language listing", () => {
  expect(escapeMarkdown("英語_英国 * | ` ~ \\")).toBe("英語\\_英国 \\* \\| \\` \\~ \\\\");
});
