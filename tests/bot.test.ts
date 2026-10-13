import { afterEach, expect, mock, spyOn, test } from "bun:test";

import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction, CommandInteractionOption, Message } from "discord.js";

import { onInteraction, onMessage } from "../src/bot";
import { commands } from "../src/commands";
import type { ConfigStore, Settings } from "../src/config";
import { LANGUAGE_CODES, LANGUAGES, LANGUAGES_WITH_FLAGS } from "../src/languages";
import * as logger from "../src/logger";
import { escapeMarkdown } from "../src/messages";

afterEach(() => mock.restore());

function configStore(): ConfigStore {
  let settings: Settings = { selectedLanguages: ["JA", "KO"], skipTranslationPrefix: ";" };
  return {
    read: () => settings,
    write: (next) => {
      settings = next;
    },
  };
}

function messageFixture(content: string, bot = false) {
  const send = mock(() => Promise.resolve());
  const author = { bot, toString: () => "<@123>" };
  return {
    send,
    message: {
      content,
      author,
      createdAt: new Date(0),
      channel: { isSendable: () => true, send },
    } as unknown as Message,
  };
}

function interactionFixture(commandName: string, data: CommandInteractionOption[] = []) {
  const reply = mock(() => Promise.resolve());
  const editReply = mock((_content: string) => Promise.resolve());
  return {
    reply,
    editReply,
    interaction: {
      commandName,
      options: { data },
      client: { ws: { ping: 42 } },
      reply,
      editReply,
    } as unknown as ChatInputCommandInteraction,
  };
}

test("message handler skips prefixed messages before making DeepL requests or sending replies", async () => {
  spyOn(logger, "info").mockImplementation(() => {});
  const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ translations: [{ text: "unexpected" }] }),
  );
  const { message, send } = messageFixture(";hello");
  await onMessage(message, configStore(), "key");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

test("message handler ignores bot messages", async () => {
  const fetchMock = spyOn(globalThis, "fetch");
  const { message, send } = messageFixture("hello", true);
  await onMessage(message, configStore(), "key");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

test("message handler translates in selection order then sends the original output and mention flags", async () => {
  const fetchMock = spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ translations: [{ text: "こんにちは" }] }))
    .mockResolvedValueOnce(Response.json({ translations: [{ text: "안녕하세요" }] }))
    .mockResolvedValueOnce(Response.json({ character_count: 10, character_limit: 500000 }));
  const { message, send } = messageFixture("hello");
  await onMessage(message, configStore(), "key");
  expect(
    fetchMock.mock.calls.map(([url, init]) =>
      String(url).endsWith("usage")
        ? "usage"
        : new URLSearchParams(String(init?.body)).get("target_lang"),
    ),
  ).toEqual(["JA", "KO", "usage"]);
  expect(send).toHaveBeenCalledWith({
    content:
      "Sender: <@123>\nSent Time: <t:0:f>\n\n🇯🇵 JA: こんにちは\n\n🇰🇷 KO: 안녕하세요\n\nTranslation Limit: 10 / 500000",
    allowedMentions: { repliedUser: false },
  });
});

test("translation failure sends the same Japanese error reply", async () => {
  spyOn(logger, "error").mockImplementation(() => {});
  spyOn(globalThis, "fetch").mockResolvedValue(new Response("error", { status: 500 }));
  const { message, send } = messageFixture("hello");
  await onMessage(message, configStore(), "key");
  expect(send).toHaveBeenCalledWith("申し訳ありません、翻訳中にエラーが発生しました。");
});

test("ping preserves its ephemeral reply and round-trip edit", async () => {
  const { interaction, reply, editReply } = interactionFixture("ping");
  await onInteraction(interaction, configStore(), "key");
  expect(reply).toHaveBeenCalledWith({ content: "gateway: 42ms", flags: MessageFlags.Ephemeral });
  expect(editReply.mock.calls[0]?.[0]).toMatch(/^gateway: 42ms\n往復: \d+ms$/);
});

test("change_language query preserves multiline text and ephemeral flags", async () => {
  const { interaction, reply } = interactionFixture("change_language");
  await onInteraction(interaction, configStore(), "key");
  expect(reply).toHaveBeenCalledWith({
    content: escapeMarkdown(
      [
        "現在の設定:",
        "🇯🇵 日本語,\n🇰🇷 韓国語",
        "",
        "利用可能な言語:",
        LANGUAGE_CODES.map((code) => `${code}: ${LANGUAGES_WITH_FLAGS[code]}`).join("\n"),
      ].join("\n"),
    ),
    flags: MessageFlags.Ephemeral,
  });
});

test("change_language writes selected true options and replies publicly with the same text", async () => {
  const store = configStore();
  const { interaction, reply } = interactionFixture("change_language", [
    { type: ApplicationCommandOptionType.Boolean, name: "日本語", value: false },
    { type: ApplicationCommandOptionType.Boolean, name: "英語_英国", value: true },
    { type: ApplicationCommandOptionType.Boolean, name: "韓国語", value: true },
  ]);
  await onInteraction(interaction, store, "key");
  expect(store.read().selectedLanguages).toEqual(["EN-GB", "KO"]);
  expect(reply).toHaveBeenCalledWith("言語を変更しました:\n🇬🇧 英語_英国,\n🇰🇷 韓国語");
});

test("skip_prefix preserves query, update and missing-option reply text and flags", async () => {
  const store = configStore();
  const query = interactionFixture("skip_prefix");
  await onInteraction(query.interaction, store, "key");
  expect(query.reply).toHaveBeenCalledWith({
    content:
      "現在の翻訳スキッププレフィックス: `;`\n\n使い方: メッセージの先頭に `;` をつけると翻訳されません。",
    flags: MessageFlags.Ephemeral,
  });
  const update = interactionFixture("skip_prefix", [
    { type: ApplicationCommandOptionType.String, name: "prefix", value: "//" },
  ]);
  await onInteraction(update.interaction, store, "key");
  expect(store.read().skipTranslationPrefix).toBe("//");
  expect(update.reply).toHaveBeenCalledWith("翻訳スキッププレフィックスを `//` に変更しました。");
  const missing = interactionFixture("skip_prefix", [
    { type: ApplicationCommandOptionType.String, name: "prefix", value: "" },
  ]);
  await onInteraction(missing.interaction, store, "key");
  expect(missing.reply).toHaveBeenCalledWith({
    content:
      "エラー: 'prefix' オプションが見つかりませんでした。プレフィックスを指定してください。",
    flags: MessageFlags.Ephemeral,
  });
});

test("get_deepl_limit preserves its public Japanese reply", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ character_count: 123, character_limit: 500000 }),
  );
  const { interaction, reply } = interactionFixture("get_deepl_limit");
  await onInteraction(interaction, configStore(), "key");
  expect(reply).toHaveBeenCalledWith("DeepLのAPI使用量: 123 / 500000");
});

test("registration preserves command names, descriptions and 25 Boolean options", () => {
  expect(commands).toEqual([
    { name: "ping", description: "疎通確認です。" },
    {
      name: "change_language",
      description: "翻訳言語を変更します。引数なしで現在の設定を表示。",
      options: Object.values(LANGUAGES).map((name) => ({
        type: ApplicationCommandOptionType.Boolean,
        name,
        description: `${name}に翻訳する場合trueを設定`,
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
  ]);
});
